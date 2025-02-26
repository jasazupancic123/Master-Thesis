import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { FieldPath, Query } from 'firebase-admin/firestore';
import { NUM_MAX_EXERCISES } from 'src/common/constant/limit.constant';
import { Create, Update } from 'src/common/type/entity.type';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { CommonService } from '../../common/service/common.service';
import { User } from '../../common/type/firebase-auth.type';
import { ExerciseRef } from '../../common/type/firestore.type';
import { Filter } from '../../common/type/orm.type';
import { Validate } from '../../common/type/validate.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { ComponentService } from '../../component/component.service';
import { Component } from '../../component/entity/component.entity';
import { FirebaseService } from '../../firebase/firebase.service';
import { Exercise } from '../entity/exercise.entity';
import { ExerciseRepository } from '../repository/exercise.repository';
import { ExerciseAttributeService } from './exercise-attribute.service';

@Injectable()
export class ExerciseService {
  private logger = new Logger(ExerciseService.name);

  constructor(
    @Inject(forwardRef(() => CacheManagerService))
    private readonly cacheManagerService: Wrapper<CacheManagerService>,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly exerciseAttributeService: ExerciseAttributeService,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  /**
   * Finds all exercises by user. Admin can create global exercises, and
   * every user can create his own exercises. Since Firestore does not support
   * OR queries, these two conditions for user must be queried separately.
   * Therefore, pagination must be performed in plain JS, not Firestore.
   */
  async findAllGlobal(filter?: Filter<Exercise>): Promise<Exercise[]> {
    let query = this.exerciseRepository
      .collection()
      .where('global', '==', true);

    return this.findAllByQuery(query, filter);
  }

  async findAllByUser(
    user: User,
    filter?: Filter<Exercise>,
  ): Promise<Exercise[]> {
    const query = this.exerciseRepository
      .collection()
      .where('userId', '==', user.uid);

    return this.findAllByQuery(query, filter);
  }

  async findAllByTrainers(
    trainersIds: string[],
    filter?: Filter<Exercise>,
  ): Promise<Exercise[]> {
    const query = this.exerciseRepository
      .collection()
      .where('userId', 'in', trainersIds);

    return this.findAllByQuery(query, filter);
  }

  async findAll(user: User, filter?: Filter<Exercise>): Promise<Exercise[]> {
    const dbUser = await this.userService.findOneByIdOrFail(user.uid);
    const userExercises = await this.findAllByUser(user, filter);
    const globalExercises = await this.findAllGlobal(filter);
    const trainerExercises =
      dbUser.trainersIds.length > 0
        ? await this.findAllByTrainers(dbUser.trainersIds, filter)
        : [];

    // if user is athlete, fetch all his trainer's exercises

    return this.commonService.array.unique([
      ...userExercises,
      ...trainerExercises,
      ...globalExercises,
    ]);
  }

  async findById(
    user: User,
    ref: Required<ExerciseRef>,
  ): Promise<Exercise | null> {
    // find exercise
    const exercise = await this.exerciseRepository.getDoc(ref.exerciseId);
    if (!exercise) return null;

    // authorize
    if (!exercise.global && exercise.userId !== user.uid) return null;
    return exercise;
  }

  async findByIdOrFail(
    user: User,
    ref: Required<ExerciseRef>,
  ): Promise<Exercise> {
    const exercise = await this.findById(user, ref);
    if (!exercise) throw new BadRequestException('Exercise does not exist');
    return exercise;
  }

  async create(
    user: User,
    data: Create<Omit<Exercise, 'userId' | 'global' | 'id' | 'values'>>,
  ): Promise<Exercise> {
    this.logger.log(
      `User ${user.uid} is creating new exercise: ${JSON.stringify(data)}`,
    );

    // validate
    const dbUser = await this.userService.findOneOrFail(user.uid);
    const exercises = await this.findAllByUser(user);
    this.checkLimit(dbUser, exercises);

    const attributes = await this.cacheManagerService.getAttributes();
    this.exerciseAttributeService.validate(
      data.attributeValues || {},
      attributes,
    );

    if (!data.componentsIds?.length)
      throw new BadRequestException('No components provided for exercise'); // at least one component must be selected

    // check that all components exist and are leafs
    const components = await this.cacheManagerService.getComponents();
    const leafs = this.componentService.leafsFromFlat(components);
    for (const slug of data.componentsIds!) {
      const component = this.componentService.getLeafBySlug(slug, leafs);
      if (!component)
        throw new BadRequestException(`Component ${slug} does not exist`);
    }

    // create exercise
    const exerciseId = await this.exerciseRepository.addDoc({
      id: null,
      userId: user.uid,
      name: data.name,
      componentsIds: data.componentsIds,
      global: this.firebaseService.isAdmin(user), // if user is admin, exercise is global
      videoUrl: data.videoUrl,
      imageUrl: data.imageUrl,
      values: Object.entries(data.attributeValues).map(([field, value]) => ({
        attributeId: field,
        value,
      })),
    });

    return {
      ...data,
      id: exerciseId,
      userId: user.uid,
      global: this.firebaseService.isAdmin(user), // if user is admin, exercise is global
      createdAt: new Date(),
      updatedAt: new Date(),
      values: Object.entries(data.attributeValues).map(([field, value]) => ({
        attributeId: field,
        value,
      })),
    };
  }

  async createMany(
    user: User,
    exercises: Create<Omit<Exercise, 'userId' | 'global' | 'id' | 'values'>>[],
  ) {
    this.logger.log(
      `User ${user.uid} is creating new exercises: ${JSON.stringify(exercises)}`,
    );

    // validate
    const dbUser = await this.userService.findOneOrFail(user.uid);
    const userExercises = await this.findAllByUser(user);

    if (!this.firebaseService.isAdmin(user)) {
      this.checkLimit(dbUser, [...(exercises as Exercise[]), ...userExercises]);
    }

    const attributes = await this.cacheManagerService.getAttributes();
    const components = await this.cacheManagerService.getComponents();

    let i = 0;
    for (const e of exercises) {
      // check limit
      if (
        !this.firebaseService.isAdmin(user) &&
        userExercises.length + i + 1 > NUM_MAX_EXERCISES
      )
        break;

      // at least one component must be selected
      if (!e.componentsIds?.length)
        throw new BadRequestException('No components provided for exercise');

      // validaite attribute values
      this.exerciseAttributeService.validate(
        e.attributeValues || {},
        attributes,
      );

      // check that all components exist and are leafs
      const leafs = this.componentService.leafsFromFlat(components);
      for (const slug of e.componentsIds!) {
        const component = this.componentService.getLeafBySlug(slug, leafs);
        if (!component)
          throw new BadRequestException(`Component ${slug} does not exist`);
      }
    }

    const batch = this.firebaseService.firestore.batch();
    const result: Exercise[] = [];

    exercises.forEach((e, i) => {
      const docRef = this.exerciseRepository.collection().doc();

      const item: Create<Exercise> = {
        id: docRef.id,
        userId: user.uid,
        name: e.name,
        componentsIds: e.componentsIds,
        global: this.firebaseService.isAdmin(user),
        imageUrl: e.imageUrl,
        videoUrl: e.videoUrl,
        values: Object.entries(e.attributeValues).map(([field, value]) => ({
          attributeId: field,
          value,
        })),
      };

      const query = this.firebaseService.buildCreateQuery<Exercise>(item, {
        timestamps: true,
      });

      batch.set(docRef, query);
      result.push({
        ...e,
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    await batch.commit();
    return result;
  }

  /**
   * "Moves" all provided exercises to the provided component (it only changes
   * the component id of the exercise).
   */
  async move(
    user: User,
    exerciseIds: string[],
    componentId: string,
  ): Promise<void> {}

  async update(user: User, ref: ExerciseRef, input: Update<Exercise>) {
    this.logger.log(
      `User ${user.uid} is updating exercise ${ref.exerciseId}: ${JSON.stringify(input)}`,
    );

    const exercise = await this.findByIdOrFail(user, ref);
    this.validateOwner(user, exercise);

    // validate
    const attributes = await this.cacheManagerService.getAttributes();
    this.exerciseAttributeService.validate(
      input.attributeValues || {},
      attributes,
    );

    if (!input.componentsIds?.length)
      throw new BadRequestException('No components provided for exercise'); // at least one component must be selected

    // check that all components exist and are leafs
    const components = await this.cacheManagerService.getComponents();
    const leafs = this.componentService.leafsFromFlat(components);
    for (const slug of input.componentsIds!) {
      const component = this.componentService.getLeafBySlug(slug, leafs);
      if (!component)
        throw new BadRequestException(`Component ${slug} does not exist`);

      // leaf's root must be the same as previous exercise root
    }

    await this.exerciseRepository.updateDoc(ref.exerciseId, {
      ...input,
      values: Object.entries(input.attributeValues).map(([field, value]) => ({
        attributeId: field,
        value,
      })),
    });

    return {
      ...exercise,
      ...this.commonService.object.clean(input),
      values: Object.entries(input.attributeValues).map(([field, value]) => ({
        attributeId: field,
        value,
      })),
    };
  }

  async delete(user: User, ref: ExerciseRef) {
    this.logger.log(`User ${user.uid} is deleting exercise ${ref.exerciseId}`);

    const exercise = await this.findByIdOrFail(user, ref);
    this.validateOwner(user, exercise);

    await this.exerciseRepository.deleteDoc(ref.exerciseId);
  }

  /**
   * Checks if provided exercises are valid for a training. It checks that all
   * exercises' leaf components belong to the training's root components.
   *
   * For example, if training has components `Strength` and `Speed` selected,
   * then exercise with component parents `Endurance` is not valid.
   */
  async validateExercises(
    rootComponentId: string,
    exercises: Exercise[],
  ): Promise<Validate> {
    // check that exercise's leaf component id belongs to training's root component id
    const components = await this.cacheManagerService.getComponents();
    const leafs = this.componentService.leafsFromFlat(components);

    // check that parents of leaf are in training's root component ids
    for (const exercise of exercises)
      for (const component of exercise.componentsIds) {
        const leaf = leafs.find((leaf) => leaf.id === component);

        if (
          !leaf ||
          !leaf.parents.some((parent) => rootComponentId === parent)
        ) {
          const found = components.find((c) => c.id === component);
          return {
            error: true,
            message: `Exercise ${exercise.name} has component ${found?.name} which is not valid for training`,
          };
        }
      }

    return { error: false };
  }

  private async findAllByQuery(
    query: Query,
    filter?: Filter<Exercise>,
  ): Promise<Exercise[]> {
    const components = await this.componentService.findAllFlat();
    if (filter) query = this.filter(query, filter, components);

    const exercises = await query
      .where('deletedAt', '==', null)
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) => this.exerciseRepository.serialize(doc)),
      );

    return exercises;
  }

  private filter(
    query: Query,
    filter: Filter<Exercise>,
    components: Component[], // flat components
  ): Query {
    if (filter.ids?.length)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.componentsIds) {
      // for each component id, find all children and filter by them
      const componentsIds: string[] = [];
      for (const componentId of filter.componentsIds.value as string[]) {
        const component = components.find((c) => c.id === componentId);
        if (!component) continue;

        // filter by root node
        componentsIds.push(component.id);

        // filter by all its children
        const tree = this.commonService.tree.fromArray(components, {
          rootId: component.id,
          idPropertyName: 'id',
          parentIdPropertyName: 'parent',
          childrenPropertyName: 'children',
        });

        this.commonService.tree.forEach(tree, 'children', (item) => {
          componentsIds.push(item.id);
          return null;
        });
      }

      if (componentsIds.length)
        query = query.where(
          'componentIds',
          'array-contains-any',
          componentsIds,
        );
    }

    return query;
  }

  private checkLimit(user: UserEntity, exercises: Exercise[]) {
    // user entity for subscription check
    if (exercises.length > NUM_MAX_EXERCISES)
      throw new ConflictException('Exercises limit reached');
  }

  private validateOwner(user: User, exercise: Exercise) {
    if (user.uid !== exercise.userId)
      throw new UnauthorizedException("You don't have access to this exercise");
  }
}
