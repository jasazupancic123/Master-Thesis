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
import { NUM_MAX_EXERCISES } from '../../common/constant/limit.constant';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { UserEntity } from '../../user/entity/user.entity';
import { UserService } from '../../user/user.service';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { CommonService } from '../../common/service/common.service';
import { User } from '../../common/type/firebase-auth.type';
import { ExerciseRef } from '../../common/type/firestore.type';
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
import { Component } from 'src/component/entity/component.entity';
import { FieldPath, FieldValue, Query } from 'firebase-admin/firestore';
import { TrainingPlanService } from '../../training/service/training-plan.service';
import { DEFAULT_PARAMS_KEY } from 'src/component/constant/param.constant';

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
    private readonly trainingPlanService: TrainingPlanService,
  ) {}

  async findAll(
    user: User,
    filter?: Record<string, string>,
  ): Promise<Exercise[]> {
    const dbUser = await this.userService.findOneByIdOrFail(user.uid);
    const components = await this.cacheManagerService.getComponents();

    const userIds = [...dbUser.trainersIds, user.uid, GLOBAL_EXERCISE_OWNER];
    let exercises: Exercise[] = [];

    if (
      this.commonService.object.isEmpty(filter) ||
      (Object.keys(filter).length === 1 && filter.componentIds)
    ) {
      // filtering only by components from exercise repository
      let query = this.exerciseRepository
        .collection()
        .where('ownerId', 'in', userIds);

      if (filter?.componentIds)
        query = this.filterByComponents(
          query,
          filter.componentIds.split(','),
          components,
        );

      exercises = await query
        .get()
        .then(({ docs }) =>
          docs.map((doc) =>
            this.firebaseService.serialize(
              doc.data() as FirestoreEntity<Exercise>,
            ),
          ),
        );
    } else {
      // filtering by attributes
      let query = this.exerciseAttributeValueRepository
        .collectionGroup()
        .where('ownerId', 'in', userIds);

      if (filter) {
        if (filter.componentIds)
          query = this.filterByComponents(
            query,
            filter.componentIds.split(','),
            components,
          );

        if (filter.field) query = query.where('field', '==', filter.field);
        if (filter.value) query = query.where('value', '==', filter.value);
        if (filter.selected)
          query = query.where('selected', '==', filter.selected);
      }

      const exerciseIds = await query
        .get()
        .then(({ docs }) => docs.map((doc) => doc.data().exerciseId));

      if (exerciseIds.length > 0)
        exercises = await this.exerciseRepository.getDocs((q) =>
          q.where(FieldPath.documentId(), 'in', exerciseIds),
        );
    }

    // map attributes
    exercises = await Promise.all(
      exercises.map(async (e) => ({
        ...e,
        attributeValues:
          await this.exerciseAttributeValueRepository.getAllByExercise({
            exerciseId: e.id,
          }),
      })),
    );

    const attributes = await this.cacheManagerService.getAttributes();

    // map params
    const finalExercises = exercises.map((exercise) => {
      const component = components.find(
        (c) => c.id === exercise.componentIds[0],
      )!;
      const root = this.componentService.getRoot(component, components);
      const componentParams = root.params || { [DEFAULT_PARAMS_KEY]: [] };

      const params = this.trainingPlanService.getComponentParamAttributes(
        componentParams,
        exercise.attributeValues,
        attributes,
      );

      exercise.defaultParams = this.trainingPlanService.getParamAttributes(params);
      return exercise;
    });

    return finalExercises;
  }

  async findAllByIds(user: User, ids: string[]) {
    const dbUser = await this.userService.findOneByIdOrFail(user.uid);
    const userIds = [...dbUser.trainersIds, user.uid, GLOBAL_EXERCISE_OWNER];

    return await this.exerciseRepository
      .collection()
      .where('ownerId', 'in', userIds)
      .where(FieldPath.documentId(), 'in', ids)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<Exercise>,
          ),
        ),
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

    if (data.componentIds.length < 1)
      throw new BadRequestException('Exercise must have atleast one component');

    // validate exercises
    const dbUser = await this.userService.findOneOrFail(user.uid);
    const exercises = await this.exerciseRepository.getDocs((q) =>
      q.where('ownerId', '==', user.uid),
    );

    this.checkLimit(dbUser, exercises);

    // validate components
    const components = await this.cacheManagerService.getComponents();
    for (const componentId of data.componentIds) {
      const component = components.find((c) => c.id === componentId);

      // check that component exists
      if (!component)
        throw new NotFoundException(`Component ${componentId} does not exist`);
    }

    // check that component is leaf
    const mainComponent = components.find(
      (c) => c.id === data.componentIds[0],
    )!;

    if (mainComponent.children?.length > 0)
      throw new BadRequestException(
        `Main component ${mainComponent.name.toLowerCase()} is not valid for an exercise`,
      );

    // validate attributes
    // NOTE - exercise inherits attributes only from the first (main) component
    const parents = mainComponent.parents!.map(
      (parentId) => components.find((c) => c.id === parentId)!,
    );

    const attributeFields = [
      ...parents.flatMap((p) => p.attributes || []),
      ...(mainComponent.attributes || []),
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
        componentIds: data.componentIds,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        instruction: data.instruction || '',
        attributeValues: undefined,
      },
    );

    batch.set(docRef, createExerciseQuery);

    // create attributes
    attributeValues.forEach((v) => {
      const docRef = this.exerciseAttributeValueRepository
        .collection({ exerciseId })
        .doc();

      const query =
        this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
          id: docRef.id,
          exerciseId,
          ownerId,
          componentIds: data.componentIds,
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
        id: undefined,
        exerciseId,
        ownerId,
        componentIds: data.componentIds,
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
      if (e.componentIds.length < 1)
        throw new BadRequestException(
          'Exercise must have atleast one component',
        );

      for (const componentId of e.componentIds) {
        const component = components.find((c) => c.id === componentId);
        if (!component)
          throw new NotFoundException(
            `Component ${componentId} does not exist`,
          );
      }

      // check that component is leaf
      const mainComponent = components.find((c) => c.id === e.componentIds[0])!;
      if (mainComponent.children?.length > 0)
        throw new BadRequestException(
          `Main component ${mainComponent.name.toLowerCase()} is not valid for an exercise`,
        );

      // validate attributes
      // NOTE - exercise inherits attributes only from the first (main) component
      const parents = mainComponent.parents!.map(
        (parentId) => components.find((c) => c.id === parentId)!,
      );

      const attributeFields = [
        ...parents.flatMap((p) => p.attributes || []),
        ...(mainComponent.attributes || []),
      ];

      const allAttributes = await this.attributeService.findAll();
      const attributes = attributeFields.map(
        (field) => allAttributes.find((a) => a.field === field)!,
      );

      const attributeValues = this.attributeService.validate(
        e.attributeValues,
        attributes || [],
      );

      e.attributeValues = attributeValues.map((v) => ({
        ...v,
        id: undefined,
        exerciseId: undefined,
        ownerId,
        componentIds: e.componentIds,
      }));

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
        componentIds: e.componentIds,
        videoUrl: e.videoUrl,
        imageUrl: e.imageUrl,
        instruction: e.instruction || '',
        attributeValues: undefined,
      };

      const query = this.firebaseService.buildCreateQuery<Exercise>(item, {
        timestamps: true,
      });

      batch.set(docRef, query);

      e.attributeValues.forEach((v) => {
        const docRef = this.exerciseAttributeValueRepository
          .collection({ exerciseId })
          .doc();

        const query =
          this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
            id: docRef.id,
            exerciseId,
            ownerId,
            componentIds: e.componentIds,
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

    if (input.componentIds?.length > 0) {
      if (input.componentIds[0] !== exercise.componentIds[0])
        throw new BadRequestException(
          'You cannot update the main component of an exercise',
        );
    }

    // validate attributes
    // delete old attribute values
    await this.exerciseAttributeValueRepository.deleteAllByExercise({
      exerciseId: exercise.id,
    });

    const components = await this.cacheManagerService.getComponents();
    const mainComponent = components.find(
      (c) => c.id === exercise.componentIds[0],
    )!;

    const parents = mainComponent.parents!.map(
      (parentId) => components.find((c) => c.id === parentId)!,
    );

    const attributeFields = [
      ...parents.flatMap((p) => p.attributes || []),
      ...(mainComponent.attributes || []),
    ];

    const allAttributes = await this.attributeService.findAll();
    const attributes = attributeFields.map(
      (field) => allAttributes.find((a) => a.field === field)!,
    );

    const attributeValues = this.attributeService.validate(
      input.attributeValues || [],
      attributes || [],
    );

    const batch = this.firebaseService.firestore.batch();
    const docRef = this.exerciseRepository.doc(exercise.id);
    batch.update(docRef, input);

    attributeValues.forEach((v) => {
      const docRef = this.exerciseAttributeValueRepository
        .collection({ exerciseId: exercise.id })
        .doc();

      const query =
        this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
          id: docRef.id,
          exerciseId: ref.exerciseId,
          ownerId: user.uid,
          componentIds: input.componentIds || exercise.componentIds,
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
  validateExercises(
    rootComponentId: string,
    exercises: Exercise[],
    leafs: Component[],
  ) {
    // check that parents of leaf are in training's root component ids
    for (const exercise of exercises) {
      for (const componentId of exercise.componentIds) {
        const leaf = leafs.find((leaf) => leaf.id === componentId)!;
        if (leaf?.id === rootComponentId) continue;
        if (!leaf.parents.includes(rootComponentId)) {
          throw new BadRequestException(
            `Exercise ${exercise.name} cannot be part of selected component`,
          );
        }
      }
    }
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

  private getLeafComponentIdsByRoots(
    rootComponentIds: string[],
    components: Component[],
  ): string[] {
    const leafComponentIds: string[] = [];

    for (const rootComponentId of rootComponentIds) {
      const component = components.find((c) => c.id === rootComponentId);
      if (!component) return;

      const tree = this.commonService.tree.fromArray(components, {
        rootId: component.id,
        idPropertyName: 'id',
        parentIdPropertyName: 'parentId',
        childrenPropertyName: 'children',
      });

      this.commonService.tree.forEach(tree, 'children', (item) => {
        if (item.children?.length === 0) leafComponentIds.push(item.id);
        return null;
      });
    }

    return leafComponentIds;
  }

  private filterByComponents(
    query: Query,
    filterComponentIds: string[],
    allComponents: Component[],
  ): Query {
    const leafs = this.getLeafComponentIdsByRoots(
      filterComponentIds,
      allComponents,
    );

    query = query.where('componentIds', 'array-contains-any', [
      ...filterComponentIds,
      leafs,
    ]);

    return query;
  }
}
