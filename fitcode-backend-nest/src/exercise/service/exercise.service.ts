import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Query } from 'firebase-admin/firestore';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { AttributeService } from '@src/attribute/service/attribute.service';
import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create, FirestoreEntity } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import {
  BatchUpdateOperation,
  ExerciseRef,
} from '@src/common/type/firestore.type';
import {
  ValidateError,
  ValidateRowError,
} from '@src/common/type/validate.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { ComponentService } from '@src/component/component.service';
import { DEFAULT_PARAMS_KEY } from '@src/component/constant/param.constant';
import { Component } from '@src/component/entity/component.entity';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionService } from '@src/institution/service/institution.service';

import { CACHE_KEY_EXERCISES } from '../constant/get-exercises-cache-key.constant';
import { GLOBAL_EXERCISE_OWNER } from '../constant/global-exercise-owner.constant';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { CreateExerciseMuscleValueDto } from '../dto/create-muscle-value.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';
import { Exercise } from '../entity/exercise.entity';
import { ExerciseAttributeValue } from '../entity/exercise-attribute-value.entity';
import { ExerciseRepository } from '../repository/exercise.repository';
import { ExerciseAttributeValueRepository } from '../repository/exercise-attribute-value.repository';

@Injectable()
export class ExerciseService implements Permission<Exercise, Institution> {
  private logger = new Logger(ExerciseService.name);

  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly repository: ExerciseRepository,
    private readonly exerciseAttributeValueRepository: ExerciseAttributeValueRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly attributeService: AttributeService,
    private readonly institutionService: InstitutionService,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
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
      exercises = await this.repository.getDocs();
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

      const params = this.componentService.getComponentParamAttributes(
        componentParams,
        exercise.attributeValues,
        attributes,
      );

      exercise.defaultParams = this.componentService.getParamAttributes(params);
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
      let query = this.repository.collection().where('ownerId', '==', userId);

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
    const exercise = await this.repository.getDoc(ref.exerciseId);
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

  @LogMethod()
  async create(user: User, data: CreateExerciseDto): Promise<Exercise> {
    const attributes = await this.attributeService.findAll();
    const components = await this.componentService.findAllFlat();

    const isAdmin = this.firebaseService.isAdmin(user);
    const isManager = this.firebaseService.isManager(user);

    const institution = isManager
      ? await this.institutionService.getDocByOwner(user.uid)
      : null;

    const ownerId = isAdmin
      ? GLOBAL_EXERCISE_OWNER
      : institution
        ? institution.id
        : null;

    if ((!institution && !isAdmin) || !ownerId || !this.canAdd(user))
      throw new UnauthorizedException(
        'You are not allowed to create exercises',
      );

    const isBilateral = data.isBilateral || false;
    const attributeValues = this.validateCreateExercise(
      data,
      components,
      attributes,
    );

    // create exercise
    const slug = this.repository.slug(data.name, institution?.id);
    const batch = this.firebaseService.firestore.batch();
    const docRef = this.repository.collection().doc(slug);
    const createExerciseQuery = this.firebaseService.buildCreateQuery<Exercise>(
      {
        id: slug,
        ownerId: ownerId,
        name: data.name,
        componentIds: data.componentIds,
        isBilateral,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        instruction: data.instruction || '',
        attributeValues: undefined,
        muscleValues: data.muscleValues || [],
      },
    );

    batch.set(docRef, createExerciseQuery);

    // create attributes
    attributeValues.forEach((v) => {
      const docRef = this.exerciseAttributeValueRepository
        .collection({ exerciseId: slug })
        .doc();

      const query =
        this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
          id: docRef.id,
          exerciseId: slug,
          ownerId,
          componentIds: data.componentIds,
          isBilateral,
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
      id: slug,
      ownerId: ownerId,
      attributeValues: attributeValues.map((v) => ({
        ...v,
        id: undefined,
        exerciseId: slug,
        ownerId,
        componentIds: data.componentIds,
        isBilateral,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Creates / updates (if exercise with same name exists) exercises in batch.
   */
  @LogMethod()
  async upsertMany(user: User, exercises: CreateExerciseDto[]) {
    // validate components
    const allComponents = await this.componentService.findAllFlat();
    const allAttributes = await this.attributeService.findAll();

    const isAdmin = this.firebaseService.isAdmin(user);
    const isManager = this.firebaseService.isManager(user);

    const institution = isManager
      ? await this.institutionService.getDocByOwner(user.uid)
      : null;

    const ownerId = isAdmin
      ? GLOBAL_EXERCISE_OWNER // if user is admin, exercise is global
      : institution
        ? institution.id
        : null;

    if ((!institution && !isAdmin) || !ownerId || !this.canAdd(user))
      throw new UnauthorizedException(
        'You are not allowed to create exercises',
      );

    const ids = exercises.map((e) => this.commonService.string.slug(e.name));
    const existingExercises = await this.getAll(ids);

    const errors: ValidateRowError<Exercise>[] = [];
    const exercisesToCreate: CreateExerciseDto[] = [];

    // validate and prepare exercises
    exercises.forEach((data, index) => {
      // NOTE - duplicates are not validated since the operation is 'upsert'
      const row = index + 1;

      const isBilateral = data.isBilateral || false;
      const attributeValues = this.validateCreateExercise(
        data,
        allComponents,
        allAttributes,
        (error: ValidateError<Exercise>) => {
          const found = errors.find((e) => e.row === row);

          if (found) found.errors.push(error);
          else
            errors.push({
              row,
              errors: [error],
            });
        },
      );

      data.attributeValues = attributeValues.map((v) => ({
        ...v,
        id: undefined,
        exerciseId: undefined,
        ownerId,
        componentIds: data.componentIds,
        isBilateral,
      }));

      exercisesToCreate.push(data);
    });

    if (errors.length > 0)
      throw new BadRequestException(JSON.stringify(errors));

    const result: Exercise[] = [];
    const batch = this.firebaseService.firestore.batch();

    // delete all attribute values for existing exercises
    for (const existing of existingExercises)
      await this.exerciseAttributeValueRepository.deleteAllByExercise(
        { exerciseId: existing.id },
        batch,
      );

    for (const e of exercisesToCreate) {
      const slug = this.repository.slug(e.name, institution?.id);
      const docRef = this.repository.collection().doc(slug);

      const item: Create<Exercise> = {
        id: slug,
        ownerId,
        name: e.name,
        componentIds: e.componentIds,
        isBilateral: e.isBilateral,
        videoUrl: e.videoUrl,
        imageUrl: e.imageUrl,
        instruction: e.instruction || '',
        attributeValues: undefined,
        muscleValues: e.muscleValues || [],
      };

      const query = this.firebaseService.buildCreateQuery<Exercise>(item, {
        timestamps: true,
      });

      batch.set(docRef, query);

      e.attributeValues.forEach((v) => {
        const docRef = this.exerciseAttributeValueRepository
          .collection({ exerciseId: slug })
          .doc();

        const query =
          this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
            id: docRef.id,
            exerciseId: slug,
            ownerId,
            componentIds: e.componentIds,
            isBilateral: e.isBilateral,
            field: v.field,
            value: v.value,
            selected: v.selected,
          });

        batch.set(docRef, query);
      });

      result.push({
        ...e,
        ...item,
        attributeValues: e.attributeValues.map((v) => ({
          ...v,
          id: undefined,
          exerciseId: slug,
          ownerId,
          componentIds: e.componentIds,
          isBilateral: e.isBilateral,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await batch.commit();
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return result;
  }

  @LogMethod()
  async updateManyMuscleValues(
    user: User,
    exercises: CreateExerciseMuscleValueDto[],
  ) {
    const isAdmin = this.firebaseService.isAdmin(user);
    const isManager = this.firebaseService.isManager(user);

    const institution = isManager
      ? await this.institutionService.getDocByOwner(user.uid)
      : null;

    const ownerId = isAdmin
      ? GLOBAL_EXERCISE_OWNER // if user is admin, exercise is global
      : institution
        ? institution.id
        : null;

    if ((!institution && !isAdmin) || !ownerId || !this.canAdd(user))
      throw new UnauthorizedException(
        'You are not allowed to create exercises',
      );

    const operations: BatchUpdateOperation<Exercise>[] = exercises.map((e) => {
      const id = this.commonService.string.slug(e.name);
      const ref = this.repository.collection().doc(id);
      const query = this.firebaseService.buildUpdateQuery({
        id: ref.id,
        muscleValues: e.muscleValues,
      });

      return { ref, data: query, operation: 'update' };
    });

    await this.firebaseService.paginateBatches(operations);
  }

  private validateCreateExercise(
    input: CreateExerciseDto,
    allComponents: Component[],
    allAttributes: Attribute[],
    onError?: (error: ValidateError<Exercise>) => void,
  ): AttributeValue[] {
    const field: keyof CreateExerciseDto = 'componentIds';

    // validate components
    if (input.componentIds.length < 1) {
      const message = 'Exercise must have at least one component';
      if (onError) {
        onError({ field, message });
        return [];
      }

      throw new BadRequestException(message);
    }

    for (const componentId of input.componentIds) {
      const component = allComponents.find((c) => c.id === componentId);
      if (!component) {
        // check that component exists
        const message = `Component ${componentId} does not exist`;
        if (onError) {
          onError({ field, message });
          return [];
        }

        throw new NotFoundException(message);
      }
    }

    // check that component is leaf
    const mainComponent = allComponents.find(
      (c) => c.id === input.componentIds[0],
    )!;

    if (mainComponent.children?.length > 0) {
      // main component must be leaf
      const message = `Main component ${mainComponent.name.toLowerCase()} is not valid for an exercise`;
      if (onError) {
        onError({ field, message });
        return [];
      }

      throw new BadRequestException(message);
    }

    return this.validateAttributeValues(
      input.attributeValues,
      mainComponent,
      allComponents,
      allAttributes,
      onError
        ? (error: ValidateError) => {
            onError({
              field: 'attributeValues',
              message: error.message,
            });
          }
        : undefined,
    );
  }

  private validateAttributeValues(
    attributeValues: AttributeValue[],
    component: Component,
    allComponents: Component[],
    allAttributes: Attribute[],
    onError?: (error: ValidateError) => void,
  ): AttributeValue[] {
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
      onError,
    );
  }

  @LogMethod()
  async update(user: User, ref: ExerciseRef, input: UpdateExerciseDto) {
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

    const attributeValues: ExerciseAttributeValue[] =
      this.validateAttributeValues(
        input.attributeValues || [],
        mainComponent,
        allComponents,
        allAttributes,
      ).map((v) => ({
        ...v,
        id: undefined,
        exerciseId: exercise.id,
        ownerId: institution?.id || GLOBAL_EXERCISE_OWNER,
        componentIds: input.componentIds || exercise.componentIds,
        isBilateral: exercise.isBilateral,
      }));

    const batch = this.firebaseService.firestore.batch();
    const docRef = this.repository.doc(exercise.id);
    const updateExerciseQuery = this.firebaseService.buildUpdateQuery<Exercise>(
      { ...input, attributeValues },
    );

    batch.update(docRef, updateExerciseQuery);

    attributeValues.forEach((v) => {
      const docRef = this.exerciseAttributeValueRepository
        .collection({ exerciseId: exercise.id })
        .doc();

      const query =
        this.firebaseService.buildCreateQuery<ExerciseAttributeValue>({
          id: docRef.id,
          exerciseId: ref.exerciseId,
          ownerId: institution?.id || GLOBAL_EXERCISE_OWNER,
          componentIds: input.componentIds || exercise.componentIds,
          isBilateral: exercise.isBilateral,
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
        ownerId: institution?.id || GLOBAL_EXERCISE_OWNER,
      })),
    };
  }

  @LogMethod()
  async delete(user: User, ref: ExerciseRef) {
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

    await this.repository.deleteDoc(ref.exerciseId);
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);
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
