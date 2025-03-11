import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
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
import { FirebaseService } from '../../firebase/firebase.service';
import { Exercise } from '../entity/exercise.entity';
import { ExerciseRepository } from '../repository/exercise.repository';
import { ExerciseAttributeValueRepository } from '../repository/exercise-attribute-value.repository';
import { ExerciseAttributeValue } from '../entity/exercise-attribute-value.entity';
import { GLOBAL_EXERCISE_OWNER } from '../constant/global-exercise-owner.constant';
import { AttributeService } from '../../attribute/service/attribute.service';

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
    private readonly attributeService: AttributeService,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  async findAll(user: User, filter?: Filter<Exercise>): Promise<Exercise[]> {
    const dbUser = await this.userService.findOneByIdOrFail(user.uid);
    const userIds = [...dbUser.trainersIds, user.uid, GLOBAL_EXERCISE_OWNER];

    const components = await this.cacheManagerService.getComponents();
    const exercises = await this.exerciseRepository.getDocs((q) => {
      q = q.where('ownerId', 'in', userIds);

      if (filter) {
        if (filter.coordination)
          q = q.where('coordination', '==', filter.coordination);

        if (filter.componentId) {
          // for each component id, find all children and filter by them
          const componentsIds: string[] = [];
          const componentId = filter.componentId;
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
            q = q.where('componentId', 'in', componentsIds);
        }

        if (filter.region) q = q.where('region', '==', filter.region);
      }

      return q;
    });

    // map attributes
    return await Promise.all(
      exercises.map(async (e) => ({
        ...e,
        attributeValues:
          await this.exerciseAttributeValueRepository.getAllByExercise({
            exerciseId: e.id,
          }),
      })),
    );
  }

  async findById(
    user: User,
    ref: Required<ExerciseRef>,
  ): Promise<Exercise | null> {
    const dbUser = await this.userService.findOneByIdOrFail(user.uid);
    const userIds = [...dbUser.trainersIds, user.uid, GLOBAL_EXERCISE_OWNER];

    // find exercise
    const exercise = await this.exerciseRepository.getDoc(ref.exerciseId);
    if (!exercise) return null;

    // authorize
    if (!userIds.includes(exercise.ownerId)) throw new ForbiddenException();
    return exercise;
  }

  async findByIdOrFail(
    user: User,
    ref: Required<ExerciseRef>,
  ): Promise<Exercise> {
    const exercise = await this.findById(user, ref);
    if (!exercise) throw new NotFoundException('Exercise does not exist');
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

    // validate exercises
    const dbUser = await this.userService.findOneOrFail(user.uid);
    const exercises = await this.exerciseRepository.getDocs((q) =>
      q.where('ownerId', '==', user.uid),
    );

    this.checkLimit(dbUser, exercises);

    // validate components
    const components = await this.cacheManagerService.getComponents();
    const component = components.find((c) => c.id === data.componentId);

    // check that component exists
    if (!component)
      throw new NotFoundException(
        `Component ${data.componentId} does not exist`,
      );

    // check that component is leaf
    if (component.children?.length > 0)
      throw new BadRequestException(
        `Component ${component.name.toLowerCase()} is invalid for selection`,
      );

    // validate attributes
    const parents = component.parents!.map(
      (parentId) => components.find((c) => c.id === parentId)!,
    );

    const attributeFields = [
      ...parents.flatMap((p) => p.attributes || []),
      ...(component.attributes || []),
    ];

    const allAttributes = await this.attributeService.findAll();
    const attributes = attributeFields.map(
      (field) => allAttributes.find((a) => a.field === field)!,
    );

    const attributeValues = this.attributeService.validate(
      data.attributeValues,
      attributes || [],
    );

    // create exercise
    const ownerId = this.firebaseService.isAdmin(user)
      ? GLOBAL_EXERCISE_OWNER // if user is admin, exercise is global
      : user.uid;

    const batch = this.firebaseService.firestore.batch();
    const docRef = this.exerciseRepository.collection().doc();
    const exerciseId = docRef.id;
    const createExerciseQuery = this.firebaseService.buildCreateQuery<Exercise>(
      {
        id: exerciseId,
        ownerId,
        name: data.name,
        componentId: data.componentId,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        region: data.region,
        coordination: data.coordination || false,
        instruction: data.instruction || '',
        tags: data.tags || [],
        attributeValues: undefined,
      },
    );

    batch.set(docRef, createExerciseQuery);

    // create attributes
    attributeValues.forEach((v) => {
      const docRef = this.exerciseAttributeValueRepository.doc({
        exerciseId,
        field: v.field,
      });

      const query =
        this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
          exerciseId,
          ownerId,
          field: v.field,
          value: v.value,
          selected: v.selected,
        });

      batch.set(docRef, query);
    });

    await batch.commit();

    return {
      ...data,
      id: exerciseId,
      ownerId,
      attributeValues: attributeValues.map((v) => ({
        ...v,
        exerciseId,
        ownerId,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async createMany(
    user: User,
    exercises: Create<Omit<Exercise, 'ownerId' | 'id' | 'attributes'>>[],
  ) {
    this.logger.log(
      `User ${user.uid} is creating new exercises: ${JSON.stringify(exercises)}`,
    );

    // validate
    const userExercises = await this.exerciseRepository.getDocs((q) =>
      q.where('ownerId', '==', user.uid),
    );

    const components = await this.cacheManagerService.getComponents();
    const ownerId = this.firebaseService.isAdmin(user)
      ? GLOBAL_EXERCISE_OWNER // if user is admin, exercise is global
      : user.uid;

    const exercisesToCreate: Create<
      Omit<Exercise, 'id' | 'ownerId' | 'attributes'>
    >[] = [];

    let i = 0;
    for (const e of exercises) {
      // check limit
      if (
        !this.firebaseService.isAdmin(user) &&
        userExercises.length + i++ + 1 > NUM_MAX_EXERCISES
      )
        break;

      // validate components
      const component = components.find((c) => c.id === e.componentId);
      if (!component)
        throw new NotFoundException(
          `Component ${e.componentId} does not exist`,
        );

      // check that component is leaf
      if (component.children?.length > 0)
        throw new BadRequestException(
          `Component ${component.name.toLowerCase()} is invalid for selection`,
        );

      // validate attributes
      const parents = component.parents!.map(
        (parentId) => components.find((c) => c.id === parentId)!,
      );

      const attributeFields = [
        ...parents.flatMap((p) => p.attributes || []),
        ...(component.attributes || []),
      ];

      const allAttributes = await this.attributeService.findAll();
      const attributes = attributeFields.map(
        (field) => allAttributes.find((a) => a.field === field)!,
      );

      e.attributeValues = this.attributeService
        .validate(e.attributeValues, attributes || [])
        .map((v) => ({ ...v, exerciseId: undefined, ownerId }));

      exercisesToCreate.push(e);
    }

    const result: Exercise[] = [];
    const batch = this.firebaseService.firestore.batch();

    exercisesToCreate.forEach((e) => {
      const docRef = this.exerciseRepository.collection().doc();
      const exerciseId = docRef.id;

      const item: Create<Exercise> = {
        id: exerciseId,
        ownerId: this.firebaseService.isAdmin(user)
          ? GLOBAL_EXERCISE_OWNER
          : user.uid,
        name: e.name,
        componentId: e.componentId,
        videoUrl: e.videoUrl,
        imageUrl: e.imageUrl,
        region: e.region,
        coordination: e.coordination || false,
        instruction: e.instruction || '',
        tags: e.tags || [],
        attributeValues: undefined,
      };

      const query = this.firebaseService.buildCreateQuery<Exercise>(item, {
        timestamps: true,
      });

      batch.set(docRef, query);

      e.attributeValues.forEach((v) => {
        const docRef = this.exerciseAttributeValueRepository.doc({
          exerciseId,
          field: v.field,
        });

        const query =
          this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
            exerciseId,
            ownerId,
            field: v.field,
            value: v.value,
            selected: v.selected,
          });

        batch.set(docRef, query);
      });

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

  async update(user: User, ref: ExerciseRef, input: Update<Exercise>) {
    this.logger.log(
      `User ${user.uid} is updating exercise ${ref.exerciseId}: ${JSON.stringify(input)}`,
    );

    const exercise = await this.findByIdOrFail(user, ref);
    this.validateOwner(user, exercise);

    if (input.componentId)
      throw new BadRequestException(
        'You cannot update component of the exercise',
      );

    // check that all components exist and are leafs
    // leaf's root must be the same as previous exercise root
    const components = await this.cacheManagerService.getComponents();
    const component = components.find((c) => c.id === exercise.componentId)!;

    // validate attributes
    const parents = component.parents!.map(
      (parentId) => components.find((c) => c.id === parentId)!,
    );

    const attributeFields = [
      ...parents.flatMap((p) => p.attributes || []),
      ...(component.attributes || []),
    ];

    const allAttributes = await this.attributeService.findAll();
    const attributes = attributeFields.map(
      (field) => allAttributes.find((a) => a.field === field)!,
    );

    const attributeValues = this.attributeService.validate(
      input.attributeValues,
      attributes || [],
    );

    const batch = this.firebaseService.firestore.batch();
    const docRef = this.exerciseRepository.doc(exercise.id);
    batch.update(docRef, input);

    attributeValues.forEach((v) => {
      const docRef = this.exerciseAttributeValueRepository.doc({
        exerciseId: ref.exerciseId,
        field: v.field,
      });

      const query =
        this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
          exerciseId: ref.exerciseId,
          ownerId: user.uid,
          field: v.field,
          value: v.value,
          selected: v.selected,
        });

      batch.set(docRef, query);
    });

    await batch.commit();

    return {
      ...exercise,
      ...this.commonService.object.clean(input),
      attributeValues: attributeValues.map((v) => ({
        ...v,
        exerciseId: ref.exerciseId,
        ownerId: user.uid,
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

  private checkLimit(user: UserEntity, exercises: Exercise[]) {
    // user entity for subscription check
    if (exercises.length > NUM_MAX_EXERCISES)
      throw new ConflictException('Exercises limit reached');
  }

  private validateOwner(user: User, exercise: Exercise) {
    if (user.uid !== exercise.ownerId)
      throw new UnauthorizedException("You don't have access to this exercise");
  }
}
