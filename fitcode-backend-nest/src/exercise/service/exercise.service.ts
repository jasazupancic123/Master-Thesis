import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Query } from 'firebase-admin/firestore';

import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import { ExerciseRef } from '@src/common/type/firestore.type';
import { BatchUpdateOperation } from '@src/common/type/orm.type';
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
import { CreateExerciseMuscleValueDto } from '../dto/create-exercise-muscle-value.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';
import { Exercise } from '../entity/exercise.entity';
import { ExerciseRepository } from '../repository/exercise.repository';
import { ExerciseAttributeService } from './exercise-attribute.service';

@Injectable()
export class ExerciseService implements Permission<Exercise, Institution> {
  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly repository: ExerciseRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly institutionService: InstitutionService,
    private readonly exerciseAttributeService: ExerciseAttributeService,
    @Inject(forwardRef(() => ComponentService))
    private readonly componentService: Wrapper<ComponentService>,
  ) {}

  async findAllGlobal(user: User, filter?: Record<string, string>) {
    return await this.findAllBy('ownerId', GLOBAL_EXERCISE_OWNER, user, filter);
  }

  async findAllByInstitution(
    user: User,
    institutionId: string,
    filter?: Record<string, string>,
  ) {
    return await this.findAllBy('institutionId', institutionId, user, filter);
  }

  async getAll(ids?: string[]): Promise<Exercise[]> {
    if (ids && !ids.length) return [];

    let exercises =
      await this.cacheManagerService.get<Exercise[]>(CACHE_KEY_EXERCISES);

    if (!exercises) {
      exercises = await this.repository.findAll();
      await this.cacheManagerService.set(CACHE_KEY_EXERCISES, exercises);
    }

    return ids?.length
      ? exercises.filter((e) => ids.includes(e.id))
      : exercises;
  }

  private async map(exercises: Exercise[]) {
    const components = await this.componentService.findAllFlat();

    // map params
    return exercises.map((exercise) => {
      const component = components.find(
        (c) => c.id === exercise.componentIds[0],
      )!;

      const root = this.componentService.getRoot(component, components);
      const componentParams = root.params || { [DEFAULT_PARAMS_KEY]: [] };

      const params = this.componentService.getComponentParamAttributes(
        componentParams,
        this.exerciseAttributeService.getValues(exercise),
        this.exerciseAttributeService.getAttributes(),
      );

      exercise.defaultParams = this.componentService.getParamAttributes(params);
      return exercise;
    });
  }

  async findAllBy(
    key: 'ownerId' | 'institutionId',
    userOrInstitutionId: string, // either global or institution id
    user: User,
    filter?: Record<string, string>,
  ): Promise<Exercise[]> {
    const components = await this.componentService.findAllFlat();
    let exercises: Exercise[] = [];

    let query = this.repository
      .collection()
      .where(key, '==', userOrInstitutionId);

    // if admin, return all exercises, else only non-disabled
    if (!this.firebaseService.isAdmin(user))
      query = query.where('disabled', '==', false);

    if (filter && !this.commonService.object.isEmpty(filter)) {
      if (filter.componentIds)
        query = this.filterByComponents(
          query,
          filter.componentIds.split(','),
          components,
        );

      query = this.exerciseAttributeService.applyFilters(query, filter);
    }

    const exerciseIds = await query
      .get()
      .then(({ docs }) => docs.map((doc) => doc.data().id as string));

    exercises = await this.getAll(exerciseIds);
    return await this.map(exercises);
  }

  async findOneById(user: User, ref: ExerciseRef): Promise<Exercise | null> {
    // find exercise
    const exercise = await this.repository.findById(ref.exerciseId);
    if (!exercise) return null;

    if (exercise.institutionId)
      exercise.institution = await this.institutionService.findById({
        institutionId: exercise.institutionId,
      });

    // authorize
    if (
      (exercise.institutionId && !exercise.institution) ||
      !this.canView(user, exercise, exercise.institution)
    )
      throw new UnauthorizedException(
        'You are not allowed to view this exercise',
      );

    return exercise;
  }

  async findOneByIdOrFail(user: User, ref: ExerciseRef): Promise<Exercise> {
    const exercise = await this.findOneById(user, ref);
    if (!exercise) throw new NotFoundException('Exercise does not exist');
    return exercise;
  }

  @LogMethod()
  async create(user: User, data: CreateExerciseDto): Promise<Exercise> {
    const components = await this.componentService.findAllFlat();
    const isAdmin = this.firebaseService.isAdmin(user);
    const isManager = this.firebaseService.isManager(user);

    const ownerId = isAdmin ? GLOBAL_EXERCISE_OWNER : user.uid;
    const institution = isManager
      ? await this.institutionService.findByOwnerId(user.uid)
      : null;

    if (!this.canAdd(user, institution))
      throw new UnauthorizedException(
        'You are not allowed to create exercises',
      );

    if (data.disabled && !isAdmin)
      throw new UnauthorizedException('You cannot create disabled exercises');

    const isUnilateral = data.isUnilateral || false;
    this.exerciseAttributeService.validate(data, { components });

    // create exercise
    const id = this.repository.slug(data.name, institution?.id);
    const create: Create<Exercise> = {
      ...data,
      id,
      ownerId,
      isUnilateral,
      institutionId: institution?.id,
    };

    await this.repository.save(create);
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return { ...create, createdAt: new Date(), updatedAt: new Date() };
  }

  /**
   * Creates / updates (if exercise with same name exists) exercises in batch.
   */
  async upsertMany(user: User, exercises: CreateExerciseDto[]) {
    // validate components
    const components = await this.componentService.findAllFlat();
    const isAdmin = this.firebaseService.isAdmin(user);
    const isManager = this.firebaseService.isManager(user);
    const ownerId = isAdmin ? GLOBAL_EXERCISE_OWNER : user.uid;

    const institution = isManager
      ? await this.institutionService.findByOwnerId(user.uid)
      : null;

    if (!this.canAdd(user, institution))
      throw new UnauthorizedException(
        'You are not allowed to create exercises',
      );

    if (isManager && exercises.some((e) => e.disabled))
      throw new UnauthorizedException('You cannot create disabled exercises');

    const errors: ValidateRowError<Exercise>[] = [];
    const exercisesToCreate: CreateExerciseDto[] = [];

    // validate and prepare exercises
    exercises.forEach((data, index) => {
      // NOTE - duplicates are not validated since the operation is 'upsert'
      const row = index + 1;
      this.exerciseAttributeService.validate(
        data,
        { components },
        (error: ValidateError<Exercise>) => {
          const found = errors.find((e) => e.row === row);

          if (found) found.errors.push(error);
          else errors.push({ row, errors: [error] });
        },
      );

      exercisesToCreate.push(data);
    });

    if (errors.length > 0)
      throw new BadRequestException(JSON.stringify(errors));

    const result: Exercise[] = [];
    const batch = this.firebaseService.firestore.batch();

    for (const e of exercisesToCreate) {
      const slug = this.repository.slug(e.name, institution?.id);
      const docRef = this.repository.collection().doc(slug);

      const item: Create<Exercise> = {
        id: slug,
        ownerId,
        name: e.name,
        institutionId: institution?.id,
        componentIds: e.componentIds,
        isUnilateral: e.isUnilateral,
        disabled: e.disabled || false,
        videoUrl: e.videoUrl,
        imageUrl: e.imageUrl,
        instruction: e.instruction || '',
        muscleValues: e.muscleValues || [],
        categories: e.categories || [],
        equipment: e.equipment || [],
        prescriptions: e.prescriptions || [],
        patterns: e.patterns || [],
        bodyRegions: e.bodyRegions || [],
        loadingSides: e.loadingSides || [],
        movementDirections: e.movementDirections || [],
        locations: e.locations || [],
        liftPriorities: e.liftPriorities || [],
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
    }

    await batch.commit();
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return result;
  }

  @LogMethod()
  async updateMuscleValues(
    user: User,
    exercises: CreateExerciseMuscleValueDto[],
  ) {
    const isManager = this.firebaseService.isManager(user);
    const institution = isManager
      ? await this.institutionService.findByOwnerId(user.uid)
      : null;

    if (!this.canAdd(user, institution))
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

  @LogMethod()
  async update(user: User, ref: ExerciseRef, input: UpdateExerciseDto) {
    const exercise = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, exercise, exercise.institution))
      throw new UnauthorizedException(
        'You are not allowed to edit this exercise',
      );

    if (input.componentIds?.length > 0) {
      if (input.componentIds[0] !== exercise.componentIds[0])
        throw new BadRequestException(
          'You cannot update the main component of an exercise',
        );
    }

    // validate attributes
    const components = await this.componentService.findAllFlat();
    this.exerciseAttributeService.validate(
      { ...exercise, ...input },
      { components },
    );

    await this.repository.update(exercise.id, input);
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);
    return { ...exercise, ...this.commonService.object.clean(input) };
  }

  @LogMethod()
  async delete(user: User, ref: ExerciseRef) {
    const exercise = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, exercise, exercise.institution))
      throw new UnauthorizedException(
        'You are not allowed to edit this exercise',
      );

    await this.repository.delete(ref.exerciseId);
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

  canAdd(user: User, institution?: Institution) {
    if (this.firebaseService.isAdmin(user)) return true;
    if (
      this.firebaseService.isManager(user) &&
      institution?.ownerId === user.uid
    )
      return true;

    return false;
  }
}
