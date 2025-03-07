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
import { NUM_MAX_EXERCISES } from '../../common/constant/limit.constant';
import { Create, Update } from '../../common/type/entity.type';
import { UserEntity } from '../../user/entity/user.entity';
import { UserService } from '../../user/user.service';
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
import { Attribute } from '../../attribute/entity/attribute.entity';
import { ExerciseAttributeValueRepository } from '../repository/exercise-attribute-value.repository';
import { ExerciseAttributeValue } from '../entity/exercise-attribute-value.entity';
import { GLOBAL_EXERCISE_OWNER } from '../constant/global-exercise-owner.constant';

@Injectable()
export class ExerciseService {
  private logger = new Logger(ExerciseService.name);

  constructor(
    @Inject(forwardRef(() => CacheManagerService))
    private readonly cacheManagerService: Wrapper<CacheManagerService>,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly exerciseAttributeValueRepository: ExerciseAttributeValueRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  async findAll(user: User, filter?: Filter<Exercise>): Promise<Exercise[]> {
    const dbUser = await this.userService.findOneByIdOrFail(user.uid);
    const userIds = [...dbUser.trainersIds, user.uid, GLOBAL_EXERCISE_OWNER];

    const exercises = await this.exerciseRepository.getDocs((q) =>
      q.where('ownerId', 'in', userIds),
    );

    // map attributes
    return await Promise.all(
      exercises.map(async (e) => ({
        ...e,
        values: await this.exerciseAttributeValueRepository.getAllByExercise({
          exerciseId: e.id,
        }),
      })),
    );
  }

  async findById(
    user: User,
    ref: Required<ExerciseRef>,
  ): Promise<Exercise | null> {
    // find exercise
    const exercise = await this.exerciseRepository.getDoc(ref.exerciseId);
    if (!exercise) return null;

    // authorize
    if (!exercise.ownerId && exercise.ownerId !== user.uid) return null;
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
    data: Create<
      Omit<Exercise, 'ownerId' | 'id' | 'values' | 'rootComponentId'>
    >,
  ): Promise<Exercise> {
    this.logger.log(
      `User ${user.uid} is creating new exercise: ${JSON.stringify(data)}`,
    );

    // validate
    const dbUser = await this.userService.findOneOrFail(user.uid);
    const exercises = await this.exerciseRepository.getDocs((q) =>
      q.where('ownerId', '==', user.uid),
    );

    this.checkLimit(dbUser, exercises);

    // check that all components exist and are leafs
    const components = await this.cacheManagerService.getComponents();
    const roots: string[] = [];

    for (const leafComponentId of data.leafComponentIds) {
      const component = components.find((c) => c.id === leafComponentId);
      if (!component)
        throw new ConflictException(
          `Component ${leafComponentId} does not exist`,
        );

      if (component.children?.length > 0)
        throw new BadRequestException(
          `Component ${component.name.toLowerCase()} is not valid`,
        );

      // validate attributes
      const attributes = [component.attributes];

      roots.push(this.componentService.getRoot(component, components).id);
    }

    // check that all components have the same root
    if (!roots.every((r) => r === roots[0]))
      throw new ConflictException(
        'You can only select sub-categories from the same parent component',
      );

    const root = this.componentService.getRoot(component, components);
    this.validateAttributes(data.attributeValues || {}, root.attributes || []);

    // create exercise
    const exerciseId = await this.exerciseRepository.addDoc({
      id: null,
      ownerId: this.firebaseService.isAdmin(user)
        ? GLOBAL_EXERCISE_OWNER
        : user.uid, // if user is admin, exercise is global
      name: data.name,
      rootComponentId: data.rootComponentId,
      componentId: data.componentId,
      videoUrl: data.videoUrl,
      imageUrl: data.imageUrl,
      bodyRegion: data.bodyRegion,
    });

    // create attributes
    const attributeValues: ExerciseAttributeValue[] = Object.entries(
      data.attributeValues,
    ).map(([field, value]) => ({
      exerciseId,
      ownerId: user.uid,
      field,
      value,
    }));

    const batch = this.firebaseService.firestore.batch();
    attributeValues.forEach((val) => {
      const docRef = this.exerciseAttributeValueRepository.doc({
        exerciseId,
        field: val.field,
      });

      const query =
        this.firebaseService.buildCreateQuery<ExerciseAttributeValue>(val);

      batch.set(docRef, query);
    });

    await batch.commit();

    return {
      ...data,
      id: exerciseId,
      ownerId: this.firebaseService.isAdmin(user) ? null : user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      values: Object.entries(data.attributeValues).map(([field, value]) => ({
        exerciseId,
        ownerId: user.uid,
        field,
        value,
      })),
    };
  }

  async createMany(
    user: User,
    exercises: Create<Omit<Exercise, 'ownerId' | 'id' | 'values'>>[],
  ) {
    this.logger.log(
      `User ${user.uid} is creating new exercises: ${JSON.stringify(exercises)}`,
    );

    // validate
    const dbUser = await this.userService.findOneOrFail(user.uid);
    const userExercises = await this.exerciseRepository.getDocs((q) =>
      q.where('ownerId', '==', user.uid),
    );

    if (!this.firebaseService.isAdmin(user)) {
      this.checkLimit(dbUser, [...(exercises as Exercise[]), ...userExercises]);
    }

    const components = await this.cacheManagerService.getComponents();

    let i = 0;
    for (const e of exercises) {
      // check limit
      if (
        !this.firebaseService.isAdmin(user) &&
        userExercises.length + i + 1 > NUM_MAX_EXERCISES
      )
        break;

      // check that component is leaf
      const leafs = this.componentService.leafsFromFlat(components);
      const component = this.componentService.getLeafBySlug(
        e.componentId,
        leafs,
      );

      if (!component)
        throw new BadRequestException(
          `Component ${component.name} does not exist`,
        );

      const rootComponent = this.componentService.getRoot(
        component,
        components,
      );

      // validaite attribute values
      this.validateAttributes(
        e.attributeValues || {},
        rootComponent.attributes || [],
      );
    }

    const batch = this.firebaseService.firestore.batch();
    const result: Exercise[] = [];

    exercises.forEach((e) => {
      const docRef = this.exerciseRepository.collection().doc();
      const exerciseId = docRef.id;

      const item: Create<Exercise> = {
        id: exerciseId,
        ownerId: this.firebaseService.isAdmin(user)
          ? GLOBAL_EXERCISE_OWNER
          : user.uid,
        name: e.name,
        componentId: e.componentId,
        imageUrl: e.imageUrl,
        videoUrl: e.videoUrl,
        bodyRegion: e.bodyRegion,
      };

      // create attributes
      const attributeValues: ExerciseAttributeValue[] = Object.entries(
        e.attributeValues,
      ).map(([field, value]) => ({
        exerciseId,
        ownerId: user.uid,
        field,
        value,
      }));

      attributeValues.forEach((val) => {
        const docRef = this.exerciseAttributeValueRepository.doc({
          exerciseId,
          field: val.field,
        });

        const query =
          this.firebaseService.buildCreateQuery<ExerciseAttributeValue>(val);

        batch.set(docRef, query);
      });

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

    // check that all components exist and are leafs
    // leaf's root must be the same as previous exercise root
    const components = await this.cacheManagerService.getComponents();
    const leafs = this.componentService.leafsFromFlat(components);
    const component = this.componentService.getLeafBySlug(
      input.componentId,
      leafs,
    );
    if (!component)
      throw new BadRequestException(
        `Component ${component.name} does not exist`,
      );

    // validate
    this.validateAttributes(
      input.attributeValues || {},
      component.attributes || [],
    );

    await this.exerciseRepository.updateDoc(ref.exerciseId, {
      ...input,
      values: Object.entries(input.attributeValues).map(([field, value]) => ({
        exerciseId: exercise.id,
        ownerId: exercise.ownerId,
        field,
        value,
      })),
    });

    return {
      ...exercise,
      ...this.commonService.object.clean(input),
      values: Object.entries(input.attributeValues).map(([field, value]) => ({
        field,
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
      for (const component of exercise.componentId) {
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

  private filter(
    query: Query,
    filter: Filter<Exercise>,
    components: Component[], // flat components
  ): Query {
    if (filter.ids?.length)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.componentId) {
      // for each component id, find all children and filter by them
      const componentsIds: string[] = [];
      const componentId = filter.componentId.value as string;
      const component = components.find((c) => c.id === componentId);
      if (!component) return;

      // filter by root node
      componentsIds.push(component.id);

      // filter by all its children
      const tree = this.commonService.tree.fromArray(components, {
        rootId: component.id,
        idPropertyName: 'id',
        parentIdPropertyName: 'parentId',
        childrenPropertyName: 'children',
      });

      this.commonService.tree.forEach(tree, 'children', (item) => {
        componentsIds.push(item.id);
        return null;
      });

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
    if (user.uid !== exercise.ownerId)
      throw new UnauthorizedException("You don't have access to this exercise");
  }

  private validateAttributes(
    values: Record<string, any>,
    attributes: Attribute[],
  ) {
    const fields = attributes.map((attribute) => attribute.field);
    for (const field of Object.keys(values))
      if (!fields.includes(field))
        throw new BadRequestException(`Attribute ${field} does not exist`);
  }
}
