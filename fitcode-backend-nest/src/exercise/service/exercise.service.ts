import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { CommonService } from '../../common/service/common.service';
import { User } from '../../common/type/firebase-auth.type';
import { ExerciseRef } from '../../common/type/firestore.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { ComponentService } from '../../component/component.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { Exercise } from '../entity/exercise.entity';
import { ExerciseRepository } from '../repository/exercise.repository';
import { ExerciseAttributeValueRepository } from '../repository/exercise-attribute-value.repository';
import { ExerciseAttributeValue } from '../entity/exercise-attribute-value.entity';
import { GLOBAL_EXERCISE_OWNER } from '../constant/global-exercise-owner.constant';
import { AttributeService } from '../../attribute/service/attribute.service';
import { Component } from '../../component/entity/component.entity';
import { Query } from 'firebase-admin/firestore';
import { TrainingPlanService } from '../../training/service/training-plan.service';
import { DEFAULT_PARAMS_KEY } from '../../component/constant/param.constant';
import { Permission } from '../../common/interface/permission.interface';
import { Institution } from '../../institution/entity/institution.entity';
import { InstitutionService } from '../../institution/service/institution.service';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { Attribute } from '../../attribute/entity/attribute.entity';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { CACHE_KEY_EXERCISES } from '../constant/get-exercises-cache-key.constant';

@Injectable()
export class ExerciseService implements Permission<Exercise, Institution> {
  private logger = new Logger(ExerciseService.name);

  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly exerciseAttributeValueRepository: ExerciseAttributeValueRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly attributeService: AttributeService,
    private readonly institutionService: InstitutionService,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
    private readonly trainingPlanService: TrainingPlanService,
  ) {}

  async findAllGlobal(filter?: Record<string, string>) {
    return await this.findAllByUser(GLOBAL_EXERCISE_OWNER, filter);
  }

  async findAllByInstitution(
    institutionId: string,
    filter?: Record<string, string>,
  ) {
    return await this.findAllByUser(institutionId, filter);
  }

  async getAll(ids?: string[]): Promise<Exercise[]> {
    if (ids && !ids.length) return [];

    let exercises =
      await this.cacheManagerService.get<Exercise[]>(CACHE_KEY_EXERCISES);

    if (!exercises) {
      exercises = await this.exerciseRepository.getDocs();
      await this.cacheManagerService.set(CACHE_KEY_EXERCISES, exercises);
    }

    return ids?.length
      ? exercises.filter((e) => ids.includes(e.id))
      : exercises;
  }

  private async map(exercises: Exercise[]) {
    let mapped: Exercise[] = exercises;

    // map attributes
    mapped = await Promise.all(
      exercises.map(async (e) => ({
        ...e,
        attributeValues:
          await this.exerciseAttributeValueRepository.getAllByExercise({
            exerciseId: e.id,
          }),
      })),
    );

    const attributes = await this.attributeService.findAll();
    const components = await this.componentService.findAllFlat();

    // map params
    return mapped.map((exercise) => {
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

      exercise.defaultParams =
        this.trainingPlanService.getParamAttributes(params);

      return exercise;
    });
  }

  async findAllByUser(
    userId: string, // either global or institution id
    filter?: Record<string, string>,
  ): Promise<Exercise[]> {
    const components = await this.componentService.findAllFlat();
    let exercises: Exercise[] = [];

    if (
      this.commonService.object.isEmpty(filter) ||
      (Object.keys(filter).length === 1 && filter.componentIds)
    ) {
      // filtering only by components from exercise repository
      let query = this.exerciseRepository
        .collection()
        .where('ownerId', '==', userId);

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
        .where('ownerId', '==', userId);

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
        .then(({ docs }) => docs.map((doc) => doc.data().exerciseId as string));

      exercises = await this.getAll(exerciseIds);
    }

    // map attributes
    return await this.map(exercises);
  }

  async findOneById(user: User, ref: ExerciseRef): Promise<Exercise | null> {
    // find exercise
    const exercise = await this.exerciseRepository.getDoc(ref.exerciseId);
    if (!exercise) return null;

    if (exercise.ownerId !== GLOBAL_EXERCISE_OWNER) {
      // institution created an exercise
      const institution = await this.institutionService.getDoc({
        institutionId: exercise.ownerId,
      });

      // authorize
      if (!this.canView(user, exercise, institution))
        throw new UnauthorizedException(
          'You are not allowed to view this exercise',
        );
    }

    return exercise;
  }

  async findOneByIdOrFail(user: User, ref: ExerciseRef): Promise<Exercise> {
    const exercise = await this.findOneById(user, ref);
    if (!exercise) throw new NotFoundException('Exercise does not exist');
    return exercise;
  }

  async create(user: User, data: CreateExerciseDto): Promise<Exercise> {
    this.logger.log(
      `User ${user.uid} is creating new exercise: ${JSON.stringify(data)}`,
    );

    const attributes = await this.attributeService.findAll();
    const components = await this.componentService.findAllFlat();

    const institution = this.firebaseService.isManager(user)
      ? await this.institutionService.getDocByOwner(user.uid)
      : null;

    const ownerId = this.firebaseService.isAdmin(user)
      ? GLOBAL_EXERCISE_OWNER // if user is admin, exercise is global
      : institution
        ? institution.id
        : null;

    if (!ownerId || !this.canAdd(user))
      throw new UnauthorizedException(
        'You are not allowed to create exercises',
      );

    const attributeValues = this.validateCreateExercise(
      data,
      components,
      attributes,
    );

    // create exercise
    const batch = this.firebaseService.firestore.batch();
    const docRef = this.exerciseRepository.collection().doc();
    const exerciseId = docRef.id;
    const createExerciseQuery = this.firebaseService.buildCreateQuery<Exercise>(
      {
        id: exerciseId,
        ownerId: ownerId,
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
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return {
      ...data,
      id: exerciseId,
      ownerId: ownerId,
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

    // validate components
    const allComponents = await this.componentService.findAllFlat();
    const allAttributes = await this.attributeService.findAll();

    const institution = this.firebaseService.isManager(user)
      ? await this.institutionService.getDocByOwner(user.uid)
      : null;

    const ownerId = this.firebaseService.isAdmin(user)
      ? GLOBAL_EXERCISE_OWNER // if user is admin, exercise is global
      : institution
        ? institution.id
        : null;

    if (!this.canAdd(user))
      throw new UnauthorizedException(
        'You are not allowed to create exercises',
      );

    const duplicates = this.commonService.array.duplicates<string>(
      exercises.map((e) => e.name),
    );

    if (duplicates.length)
      throw new BadRequestException(
        `You have a duplicate exercise ${duplicates[0]}`,
      );

    const exercisesToCreate: Create<
      Omit<Exercise, 'id' | 'ownerId' | 'attributes'>
    >[] = [];

    for (const data of exercises) {
      const attributeValues = this.validateCreateExercise(
        data,
        allComponents,
        allAttributes,
      );

      data.attributeValues = attributeValues.map((v) => ({
        ...v,
        id: undefined,
        exerciseId: undefined,
        ownerId,
        componentIds: data.componentIds,
      }));

      exercisesToCreate.push(data);
    }

    const result: Exercise[] = [];
    const batch = this.firebaseService.firestore.batch();

    exercisesToCreate.forEach((e) => {
      const docRef = this.exerciseRepository.collection().doc();
      const exerciseId = docRef.id;

      const item: Create<Exercise> = {
        id: exerciseId,
        ownerId,
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
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return result;
  }

  private validateCreateExercise(
    input: CreateExerciseDto,
    allComponents: Component[],
    allAttributes: Attribute[],
  ): AttributeValue[] {
    // validate components
    if (input.componentIds.length < 1)
      throw new BadRequestException('Exercise must have atleast one component');

    for (const componentId of input.componentIds) {
      const component = allComponents.find((c) => c.id === componentId);
      if (!component)
        // check that component exists
        throw new NotFoundException(`Component ${componentId} does not exist`);
    }

    // check that component is leaf
    const mainComponent = allComponents.find(
      (c) => c.id === input.componentIds[0],
    )!;

    if (mainComponent.children?.length > 0)
      throw new BadRequestException(
        `Main component ${mainComponent.name.toLowerCase()} is not valid for an exercise`,
      );

    return this.validateAttributeValues(
      input.attributeValues,
      mainComponent,
      allComponents,
      allAttributes,
    );
  }

  private validateAttributeValues(
    attributeValues: AttributeValue[],
    component: Component,
    allComponents: Component[],
    allAttributes: Attribute[],
  ) {
    // validate attributes
    // NOTE - exercise inherits attributes only from the first (main) component
    const parents = component.parents!.map(
      (parentId) => allComponents.find((c) => c.id === parentId)!,
    );

    const attributeFields = [
      ...parents.flatMap((p) => p.attributes || []),
      ...(component.attributes || []),
    ];

    const attributes = attributeFields.map(
      (field) => allAttributes.find((a) => a.field === field)!,
    );

    return this.attributeService.validate(
      attributeValues || [],
      attributes || [],
    );
  }

  async update(user: User, ref: ExerciseRef, input: Update<Exercise>) {
    this.logger.log(
      `User ${user.uid} is updating exercise ${ref.exerciseId}: ${JSON.stringify(input)}`,
    );

    const exercise = await this.findOneByIdOrFail(user, ref);

    let institution: Institution | null = null;
    if (exercise.ownerId !== GLOBAL_EXERCISE_OWNER)
      institution = await this.institutionService.getDocByIdOrFail({
        institutionId: exercise.ownerId,
      });

    if (!this.canEdit(user, exercise, institution))
      throw new UnauthorizedException(
        'You are not allowed to edit this exercise',
      );

    if (input.componentIds?.length > 0) {
      if (input.componentIds[0] !== exercise.componentIds[0])
        throw new BadRequestException(
          'You cannot update the main component of an exercise',
        );
    }

    const allComponents = await this.componentService.findAllFlat();
    const allAttributes = await this.attributeService.findAll();

    // validate attributes
    // delete old attribute values
    await this.exerciseAttributeValueRepository.deleteAllByExercise({
      exerciseId: exercise.id,
    });

    const mainComponent = allComponents.find(
      (c) => c.id === exercise.componentIds[0],
    )!;

    const attributeValues = this.validateAttributeValues(
      input.attributeValues || [],
      mainComponent,
      allComponents,
      allAttributes,
    );

    const batch = this.firebaseService.firestore.batch();
    const docRef = this.exerciseRepository.doc(exercise.id);
    const updateExerciseQuery =
      this.firebaseService.buildUpdateQuery<Exercise>(input);

    batch.update(docRef, updateExerciseQuery);

    attributeValues.forEach((v) => {
      const docRef = this.exerciseAttributeValueRepository
        .collection({ exerciseId: exercise.id })
        .doc();

      const query =
        this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
          id: docRef.id,
          exerciseId: ref.exerciseId,
          ownerId: institution.id,
          componentIds: input.componentIds || exercise.componentIds,
          field: v.field,
          value: v.value,
          selected: v.selected,
        });

      batch.set(docRef, query);
    });

    await batch.commit();
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return {
      ...exercise,
      ...this.commonService.object.clean(input),
      attributeValues: attributeValues.map((v) => ({
        ...v,
        exerciseId: ref.exerciseId,
        ownerId: institution.id,
      })),
    };
  }

  async delete(user: User, ref: ExerciseRef) {
    this.logger.log(`User ${user.uid} is deleting exercise ${ref.exerciseId}`);

    const exercise = await this.findOneByIdOrFail(user, ref);

    let institution: Institution | null = null;
    if (exercise.ownerId !== GLOBAL_EXERCISE_OWNER)
      institution = await this.institutionService.getDocByIdOrFail({
        institutionId: exercise.ownerId,
      });

    if (!this.canEdit(user, exercise, institution))
      throw new UnauthorizedException(
        'You are not allowed to edit this exercise',
      );

    await this.exerciseRepository.deleteDoc(ref.exerciseId);
  }

  /**
   * Checks if provided exercises are valid for a training. It checks that all
   * exercises' leaf components belong to the training's root components.
   *
   * For example, if training has components `Strength` and `Speed` selected,
   * then exercise with component parents `Endurance` is not valid.
   */
  validateComponents(
    rootComponentId: string,
    exercises: Exercise[],
    leafs: Component[],
  ) {
    // check that parents of leaf are in training's root component ids
    for (const exercise of exercises)
      for (const componentId of exercise.componentIds) {
        const leaf = leafs.find((leaf) => leaf.id === componentId)!;
        if (leaf?.id === rootComponentId) continue;
        if (!leaf.parents.includes(rootComponentId))
          throw new BadRequestException(
            `Exercise ${exercise.name} cannot be part of selected component`,
          );
      }
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

    return query.where('componentIds', 'array-contains-any', [
      ...filterComponentIds,
      ...leafs,
    ]);
  }

  canView(user: User, exercise: Exercise, institution?: Institution) {
    if (exercise.ownerId === GLOBAL_EXERCISE_OWNER) return true;
    if (exercise.ownerId === user.uid) return true;

    if (institution) {
      if (user.uid === institution.ownerId) return true;
      if (institution.trainerIds.includes(user.uid)) return true;
      if (institution.athleteIds.includes(user.uid)) return true;
    }

    return false;
  }

  canEdit(user: User, _exercise: Exercise, institution?: Institution) {
    if (this.firebaseService.isAdmin(user)) return true;

    if (institution) {
      if (
        this.firebaseService.isManager(user) &&
        user.uid === institution.ownerId
      )
        return true;

      if (
        this.firebaseService.isTrainer(user) &&
        institution.trainerIds.includes(user.uid)
      )
        return true;
    }

    return false;
  }

  canAdd(user: User) {
    if (this.firebaseService.isAdmin(user)) return true;
    if (this.firebaseService.isManager(user)) return true;
    return false;
  }
}
