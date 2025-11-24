import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';

import { CacheManagerService } from '@src/cache-manager/cache-manager.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
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
import { ExerciseParamService } from './exercise-param.service';

@Injectable()
export class ExerciseService implements Permission<Exercise, Institution> {
  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly repository: ExerciseRepository,
    private readonly common: CommonService,
    private readonly firebase: FirebaseService,
    private readonly institutionService: InstitutionService,
    private readonly exerciseAttributeService: ExerciseAttributeService,
    private readonly exerciseParamService: ExerciseParamService,
  ) {}

  @LogMethod()
  async findAll(user: User, institutionId: string) {
    return [
      ...(await this.findAllGlobal(user)),
      ...(await this.findAllByInstitution(user, institutionId)),
    ];
  }

  async findAllGlobal(user: User, filter?: Record<string, string>) {
    const cached =
      await this.cacheManagerService.get<Exercise[]>(CACHE_KEY_EXERCISES);

    if (cached) {
      let exercises = cached.filter((e) => e.ownerId === GLOBAL_EXERCISE_OWNER);
      if (!this.firebase.isAdmin(user))
        exercises = exercises.filter((e) => !e.disabled);

      return exercises;
    }

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

  async findAllBy(
    key: 'ownerId' | 'institutionId',
    userOrInstitutionId: string, // either global or institution id
    user: User,
    filter?: Record<string, string>,
  ): Promise<Exercise[]> {
    let query = this.repository
      .collection()
      .where(key, '==', userOrInstitutionId);

    // if admin, return all exercises, else only non-disabled
    if (!this.firebase.isAdmin(user))
      query = query.where('disabled', '==', false);

    if (filter && !this.common.object.isEmpty(filter))
      query = this.exerciseAttributeService.applyFilters(query, filter);

    const exerciseIds = await query
      .get()
      .then(({ docs }) => docs.map((doc) => doc.data().id as string));

    return await this.getAll(exerciseIds);
  }

  async findByIdOrFail(exerciseId: string): Promise<Exercise | null> {
    const exercise = await this.repository.findById(exerciseId);
    if (!exercise) throw new NotFoundException('Exercise does not exist');
    return exercise;
  }

  async findOneById(user: User, ref: ExerciseRef): Promise<Exercise | null> {
    // find exercise
    const exercise = await this.repository.findById(ref.exerciseId);
    if (!exercise) return null;

    if (exercise.institutionId)
      exercise.institution = await this.institutionService.findById(
        user,
        exercise.institutionId,
      );

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
    const isAdmin = this.firebase.isAdmin(user);
    const isManager = this.firebase.isManager(user);

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
    this.exerciseAttributeService.validate(data);

    // create exercise
    const id = this.repository.slug(data.name, institution?.id);
    const main = this.exerciseAttributeService.getRootMainComponent(
      data.components[0],
    );

    if (!main) throw new BadRequestException('Main component not found');

    const create: Create<Exercise> = {
      ...data,
      id,
      ownerId,
      isUnilateral,
      institutionId: institution?.id,
      params: data.params?.length
        ? data.params
        : this.exerciseParamService.getComponentParams(main, isUnilateral),
    };

    await this.repository.save(create);
    await this.incrementExerciseRevisions(user, institution?.id);
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return { ...create, createdAt: new Date(), updatedAt: new Date() };
  }

  /**
   * Creates / updates (if exercise with same name exists) exercises in batch.
   */
  async upsertMany(user: User, exercises: CreateExerciseDto[]) {
    // validate components
    const isAdmin = this.firebase.isAdmin(user);
    const isManager = this.firebase.isManager(user);
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
        (error: ValidateError<Exercise>) => {
          const found = errors.find((e) => e.row === row);
          if (found) found.errors.push(error);
          else errors.push({ row, errors: [error] });
        },
      );

      // if there are errors, skip further validation
      if (errors.find((e) => e.row === row)) return;

      const isUnilateral = data.isUnilateral || false;
      const main = this.exerciseAttributeService.getRootMainComponent(
        data.components[0],
      );

      if (!main) return;

      exercisesToCreate.push({
        ...data,
        isUnilateral,
        params: data.params?.length
          ? data.params
          : this.exerciseParamService.getComponentParams(main, isUnilateral),
      });
    });

    if (errors.length > 0)
      throw new BadRequestException(JSON.stringify(errors));

    const result: Exercise[] = [];
    const batch = this.firebase.firestore.batch();

    for (const e of exercisesToCreate) {
      const slug = this.repository.slug(e.name, institution?.id);
      const docRef = this.repository.collection().doc(slug);

      const item: Create<Exercise> = {
        id: slug,
        ownerId,
        name: e.name,
        institutionId: institution?.id,
        components: e.components,
        isUnilateral: e.isUnilateral,
        disabled: e.disabled || false,
        videoUrl: e.videoUrl,
        imageUrl: e.imageUrl,
        instruction: e.instruction || '',
        muscleValues: e.muscleValues || [],
        equipment: e.equipment || [],
        prescriptions: e.prescriptions || [],
        patterns: e.patterns || [],
        bodyRegions: e.bodyRegions || [],
        loadingSides: e.loadingSides || [],
        movementDirections: e.movementDirections || [],
        locations: e.locations || [],
        liftPriorities: e.liftPriorities || [],
        params: e.params || [],
      };

      const query = this.firebase.buildCreateQuery<Exercise>(item, {
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
    await this.incrementExerciseRevisions(user, institution?.id);
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return result;
  }

  @LogMethod()
  async updateMuscleValues(
    user: User,
    exercises: CreateExerciseMuscleValueDto[],
  ) {
    const isManager = this.firebase.isManager(user);
    const institution = isManager
      ? await this.institutionService.findByOwnerId(user.uid)
      : null;

    if (!this.canAdd(user, institution))
      throw new UnauthorizedException(
        'You are not allowed to create exercises',
      );

    const operations: BatchUpdateOperation<Exercise>[] = exercises.map((e) => {
      const id = this.common.string.slug(e.name);
      const ref = this.repository.collection().doc(id);
      const query = this.firebase.buildUpdateQuery({
        id: ref.id,
        muscleValues: e.muscleValues,
      });

      return { ref, data: query, operation: 'update' };
    });

    await this.incrementExerciseRevisions(user, institution?.id);
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);
    await this.firebase.paginateBatches(operations);
  }

  @LogMethod()
  async update(user: User, ref: ExerciseRef, input: UpdateExerciseDto) {
    const exercise = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, exercise, exercise.institution))
      throw new UnauthorizedException(
        'You are not allowed to edit this exercise',
      );

    if (input.components?.length > 0) {
      if (input.components[0] !== exercise.components[0])
        throw new BadRequestException(
          'You cannot update the main component of an exercise',
        );
    }

    // validate attributes
    this.exerciseAttributeService.validate({ ...exercise, ...input });

    await this.repository.update(exercise.id, input);
    await this.incrementExerciseRevisions(user, exercise.institutionId);
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);

    return { ...exercise, ...this.common.object.clean(input) };
  }

  @LogMethod()
  async delete(user: User, ref: ExerciseRef) {
    const exercise = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, exercise, exercise.institution))
      throw new UnauthorizedException(
        'You are not allowed to edit this exercise',
      );

    await this.repository.delete(ref.exerciseId);
    await this.incrementExerciseRevisions(user, exercise.institutionId);
    await this.cacheManagerService.del(CACHE_KEY_EXERCISES);
  }

  private async incrementExerciseRevisions(user: User, institutionId?: string) {
    if (this.firebase.isAdmin(user)) {
      const doc = this.firebase.firestore
        .collection(FirestoreCollection.META)
        .doc('exercises');

      const snapshot = await doc.get();
      if (!snapshot.exists) await doc.set({ revision: 1 });
      else await doc.update({ revision: FieldValue.increment(1) });
    } else if (institutionId)
      await this.institutionService.incrementExerciseRevisions(institutionId);
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
    if (this.firebase.isAdmin(user)) return true;

    if (institution) {
      if (this.firebase.isManager(user) && user.uid === institution.ownerId)
        return true;

      if (
        this.firebase.isTrainer(user) &&
        institution.trainerIds.includes(user.uid)
      )
        return true;
    }

    return false;
  }

  canAdd(user: User, institution?: Institution) {
    if (this.firebase.isAdmin(user)) return true;
    if (this.firebase.isManager(user) && institution?.ownerId === user.uid)
      return true;

    return false;
  }
}
