import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { Training } from '../entity/training.entity';
import { ComponentService } from '../../component/component.service';
import { ExerciseService } from '../../exercise/service/exercise.service';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
  Populate,
} from '../../common/type/orm.type';
import { Validate } from '../../common/type/validate.type';
import { GroupService } from '../../group/service/group.service';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Wrapper } from '../../common/type/wrapper.type';
import { TrainingRepository } from '../repository/training.repository';
import { TrainingComponentRepository } from '../repository/training-component.repository';
import { TrainingExerciseRepository } from '../repository/training-exercise.repository';
import { SubgroupRepository } from '../../group/repository/subgroup.repository';
import { TrainingExerciseService } from './training-exercise.service';
import { TrainingComponentService } from './training-component.service';
import {
  TrainingComponentRef,
  TrainingExerciseRef,
  TrainingRef,
  TrainingSupersetRef,
} from '../../common/type/firebase-firestore.type';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { SubgroupService } from '../../group/service/subgroup.service';
import { TrainingSupersetRepository } from '../repository/training-superset.repository';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { TrainingSupersetService } from './training-superset.service';
import {
  CreateTrainingExercise,
  UpdateTrainingExercise,
} from '../type/training-exercise.type';
import { CreateTrainingSuperset } from '../type/training-superset.type';
import {
  CreateTrainingComponent,
  UpdateTrainingComponent,
} from '../type/training-component.type';
import { Component } from '../../component/entity/component.entity';
import { CreateTraining, UpdateTraining } from '../type/training.type';
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Group } from '../../group/entity/group.entity';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingComponentRepository: TrainingComponentRepository,
    private readonly trainingSupersetRepository: TrainingSupersetRepository,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    @Inject(forwardRef(() => SubgroupService))
    private readonly subgroupService: Wrapper<SubgroupService>,
    private readonly subgroupRepository: SubgroupRepository,
    private readonly trainingExerciseService: TrainingExerciseService,
    private readonly trainingComponentService: TrainingComponentService,
    private readonly trainingSupersetService: TrainingSupersetService,
  ) {}

  async findOne(
    user: User,
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training> & { authorize?: boolean },
  ): Promise<Training | null> {
    // find training
    const training = await this.trainingRepository.getDoc(ref.trainingId);
    if (!training) return null;

    // authorize user
    if (options?.authorize)
      if (!this.isAuthorized(user, training))
        throw new UnauthorizedException(
          'You are not authorized to view this training',
        );

    // populate training
    if (options?.populate) await this.populate(ref, training, options.populate);

    return training;
  }

  async findOneOrFail(
    user: User,
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training> & { authorize?: boolean },
  ): Promise<Training> {
    const training = await this.findOne(user, ref, options);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findAll(
    user: User,
    options?: FindManyOptions<Training> & { authorize?: boolean },
  ): Promise<Training[]> {
    const isTrainer = this.firebaseService.isTrainer(user);
    const isAthlete = this.firebaseService.isAthlete(user);

    const filter = {
      ...(options?.filter && options.filter),
      ...(isTrainer && { ownerId: { value: user.uid } }),
      ...(isAthlete && { membersIds: { value: user.uid } }),
    };

    let trainings = await this.trainingRepository.getDocs((collection) => {
      let query = this.filter(collection, filter);
      if (options?.paginate) query = this.paginate(query, options.paginate);
      query = query.orderBy('from', 'asc');
      return query;
    });

    if (options?.authorize)
      trainings = trainings.filter((training) =>
        this.isAuthorized(user, training),
      );

    if (options?.populate)
      await Promise.all(
        trainings.map(async (training) => {
          const trainingRef = { trainingId: training.id };
          await this.populate(trainingRef, training, options.populate);
        }),
      );

    return trainings;
  }

  async create(user: User, input: CreateTraining): Promise<Training> {
    this.logger.debug(
      `Creating training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    if (!this.firebaseService.isTrainer(user))
      throw new UnauthorizedException(
        'You are not authorized to create training',
      );

    // find parent references
    const group = await this.groupService.findOneOrFail({
      groupId: input.groupId,
    });

    const availableMembers = await this.groupService.findAvailableMembers({
      groupId: group.id,
    });

    // validate data
    const data: CreateTraining = {
      groupId: group.id,
      ownerId: user.uid,
      membersIds: availableMembers,
      subgroupId: input.subgroupId || null,
      componentIds: input.componentIds,
      from: input.from,
      to: input.to,
    };

    const { error, message } = await this.validate(user.uid, group, data);
    if (error) throw new BadRequestException(message);

    // create training
    const trainingId = await this.trainingRepository.addDoc(data);
    const training: Training = {
      id: trainingId,
      ...data,
      components: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    training.components = await this.trainingComponentService.createMany(
      { trainingId },
      input.componentIds.map((componentId) => ({
        componentId,
        membersIds: availableMembers,
      })),
    );

    return training;
  }

  async copy(
    user: User,
    source: { trainingId: string },
    destination: { groupId: string; subgroupId: string | null },
  ): Promise<Training> {
    this.logger.debug(
      `Copying training ${source.trainingId} (user ${user.uid})`,
    );

    // copy all training data from source to destination
    const sourceTraining = await this.findOneOrFail(
      user,
      { trainingId: source.trainingId },
      {
        authorize: true,
        populate: [
          'subgroup',
          'components',
          'components.supersets',
          'components.supersets.exercises',
        ],
      },
    );

    const group = await this.groupService.findOneOrFail(
      { groupId: destination.groupId },
      { populate: ['availableMembersIds'] },
    );

    if (user.uid !== group.ownerId)
      throw new UnauthorizedException(
        'You are not authorized to copy training',
      );

    const subgroup = destination.subgroupId
      ? await this.subgroupService.findOneOrFail(destination)
      : null;

    const membersIds = subgroup
      ? subgroup.membersIds
      : group.availableMembersIds;

    // validate data
    const data: CreateTraining = {
      groupId: group.id,
      ownerId: group.ownerId,
      membersIds,
      subgroupId: subgroup?.id || null,
      componentIds: [],
      copiedFromId: subgroup ? sourceTraining.id : null,
      from: sourceTraining.from,
      to: sourceTraining.to,
    };

    const { error, message } = await this.validate(user.uid, group, data);
    if (error) throw new BadRequestException(message);

    // create new training with the same data as the source
    const trainingId = await this.trainingRepository.addDoc(data);

    // create training components
    const components = await this.trainingComponentService.createMany(
      source,
      sourceTraining.components.map((component) => ({
        membersIds,
        componentId: component.componentId,
        color: component.color,
        supersets: component.supersets.map((superset) => ({
          membersIds,
          color: superset.color,
          exercises: superset.exercises.map((exercise) => ({
            membersIds,
            exerciseId: exercise.exerciseId,
            meta: exercise.meta,
            color: exercise.color,
          })),
        })),
      })),
    );

    return {
      id: trainingId,
      group,
      subgroup,
      ...data,
      components,
      from: data.from,
      to: data.to,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(user: User, ref: Required<TrainingRef>, input: UpdateTraining) {
    this.logger.debug(
      `Updating training ${ref.trainingId} (user ${user.uid}): ${JSON.stringify(
        input,
      )}`,
    );

    // find training
    const training = await this.findOneOrFail(user, ref, { authorize: true });

    if (input.from || input.to) {
      // check that training doesn't overlap with other trainings
      const trainings = await this.findAll(user, {
        filter: {
          groupId: { value: training.groupId },
          from: { op: '>', value: input.to },
          to: { op: '<', value: input.from },
        },
      });

      if (trainings.length > 0)
        throw new BadRequestException('Training overlaps with other training');
    }

    await this.trainingRepository.updateDoc(ref.trainingId, input);
    return {
      ...training,
      ...input,
      updatedAt: new Date(),
    };
  }

  async remove(user: User, ref: Required<TrainingRef>): Promise<void> {
    this.logger.debug(`Removing training ${ref.trainingId} (user ${user.uid})`);
    await this.findOneOrFail(user, ref, { authorize: true });
    await this.trainingRepository.deleteDoc(ref.trainingId);
  }

  async addComponents(
    user: User,
    ref: Required<TrainingRef>,
    input: CreateTrainingComponent[],
  ): Promise<TrainingComponent[]> {
    this.logger.debug(
      `Adding component to training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    const training = await this.findOneOrFail(user, ref, {
      authorize: true,
      populate: ['components'],
    });

    // make sure that all components exist
    const componentIds = input.map((item) => item.componentId);
    const components = await this.componentService.findAllFlat({
      filter: { ids: componentIds },
    });

    if (components.length !== componentIds.length)
      throw new BadRequestException('Some components do not exist');

    // training components must be unique
    const duplicates: Component[] = [];
    for (const component of components) {
      const exists = training.components?.find(
        (c) => c.componentId === component.id,
      );

      if (exists) duplicates.push(component);
    }

    if (duplicates.length)
      throw new BadRequestException(
        `Components ${duplicates.map((c) => c.name.toLowerCase()).join(', ')} already exist in the training`,
      );

    return await this.trainingComponentService.createMany(ref, input);
  }

  async updateComponent(
    user: User,
    ref: Required<TrainingComponentRef>,
    input: UpdateTrainingComponent,
  ): Promise<TrainingComponent> {
    this.logger.debug(
      `Updating component in training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    await this.findOneOrFail(user, ref, { authorize: true });
    return await this.trainingComponentService.update(ref, input);
  }

  async removeComponent(
    user: User,
    ref: Required<TrainingComponentRef>,
  ): Promise<void> {
    this.logger.debug(`Removing component from training (user ${user.uid})`);
    await this.findOneOrFail(user, ref, { authorize: true });
    await this.trainingComponentService.remove(ref);
  }

  async addSuperset(
    user: User,
    ref: Required<TrainingComponentRef>,
    input: CreateTrainingSuperset,
  ): Promise<TrainingSuperset> {
    this.logger.debug(
      `Adding superset to training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    await this.findOneOrFail(user, ref, { authorize: true });
    const component = await this.trainingComponentRepository.getDoc(ref);
    if (!component)
      throw new BadRequestException('Training component not found');

    // validate exercises
    if (input.exercises?.length) {
      const exerciseIds = input.exercises.map((e) => e.exerciseId);
      const exercises = await this.exerciseService.findAll(user, {
        filter: { ids: exerciseIds },
      });

      const { error, message } = await this.exerciseService.validateExercises(
        ref.componentId,
        exercises,
      );

      if (error) throw new BadRequestException(message);
    }

    // create training superset
    return await this.trainingSupersetService.create(ref, {
      color: input.color,
      exercises: input.exercises,
    });
  }

  async updateSuperset(
    user: User,
    ref: Required<TrainingSupersetRef>,
    input: CreateTrainingSuperset,
  ): Promise<TrainingSuperset> {
    this.logger.debug(
      `Updating superset in training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    await this.findOneOrFail(user, ref, { authorize: true });
    return await this.trainingSupersetService.update(ref, input);
  }

  async removeSuperset(
    user: User,
    ref: Required<TrainingSupersetRef>,
  ): Promise<void> {
    this.logger.debug(`Removing superset from training (user ${user.uid})`);
    await this.findOneOrFail(user, ref, { authorize: true });
    await this.trainingSupersetService.remove(ref);
  }

  async addExercises(
    user: User,
    ref: Required<TrainingSupersetRef>,
    input: CreateTrainingExercise[],
  ): Promise<TrainingExercise[]> {
    this.logger.debug(
      `Adding exercise to training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    await this.findOneOrFail(user, ref, { authorize: true });
    const superset = await this.trainingSupersetRepository.getDoc(ref);
    if (!superset) throw new BadRequestException('Training superset not found');

    // find all exercises
    const exerciseIds = input.map((e) => e.exerciseId);
    const exercises = await this.exerciseService.findAll(user, {
      filter: { ids: exerciseIds },
    });

    if (exercises.length !== exerciseIds.length)
      throw new BadRequestException('Some exercises do not exist');

    // validate exercises
    const { error, message } = await this.exerciseService.validateExercises(
      ref.componentId,
      exercises,
    );

    if (error) throw new BadRequestException(message);

    // add exercises to training component
    const trainingExercises = await this.trainingExerciseService.createMany(
      ref,
      input,
    );

    // populate exercises
    return trainingExercises.map((exercise) => {
      exercise.exercise = exercises.find((e) => e.id === exercise.exerciseId);
      return exercise;
    });
  }

  async updateExercise(
    user: User,
    ref: Required<TrainingExerciseRef>,
    input: UpdateTrainingExercise,
  ): Promise<TrainingExercise> {
    this.logger.debug(
      `Updating exercise in training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    await this.findOneOrFail(user, ref, { authorize: true });
    const trainingExercise = await this.trainingExerciseRepository.getDoc(ref);
    if (!trainingExercise)
      throw new BadRequestException('Training exercise not found');

    // make sure user has access to the exercise
    const exerciseRef = { exerciseId: trainingExercise.exerciseId };
    const exercise = await this.exerciseService.findOneOrFail(exerciseRef, {
      userId: user.uid,
    });

    // validate exercise
    const { error, message } = await this.exerciseService.validateExercises(
      ref.componentId,
      [exercise],
    );

    if (error) throw new BadRequestException(message);

    // update training exercise and its user data
    return await this.trainingExerciseService.update(ref, input);
  }

  async removeExercise(
    user: User,
    ref: Required<TrainingExerciseRef>,
  ): Promise<void> {
    this.logger.debug(`Removing exercise from training (user ${user.uid})`);
    await this.findOneOrFail(user, ref, { authorize: true });
    await this.trainingExerciseService.remove(ref);
  }

  private filter(query: Query, filter: Filter<Training>) {
    if (filter.ids) query = query.where('id', 'in', filter.ids);

    if (filter.groupId)
      query = query.where('groupId', '==', filter.groupId.value);

    if (filter.ownerId)
      query = query.where('ownerId', '==', filter.ownerId.value);

    if (filter.membersIds)
      query = query.where(
        'membersIds',
        'array-contains',
        filter.membersIds.value,
      );

    if (filter.subgroupId)
      query = query.where(
        'subgroupId',
        filter.subgroupId.op || '==',
        filter.subgroupId.value,
      );

    if (filter.from)
      query = query.where(
        'from',
        filter.from.op || '>=',
        Timestamp.fromDate(filter.from.value),
      );

    if (filter.to)
      query = query.where(
        'to',
        filter.to.op || '<=',
        Timestamp.fromDate(filter.to.value),
      );

    return query;
  }

  private paginate(query: Query, paginate: PaginateOptions<Training>) {
    const orderBy = paginate.orderBy || { field: 'from', value: 'asc' };
    const page = paginate.page || 1;
    const pageSize = paginate.pageSize || DEFAULT_PAGE_SIZE;

    return query
      .orderBy(orderBy.field, orderBy.value)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  }

  private async populate(
    ref: Required<TrainingRef>,
    training: Training,
    populate: Populate<Training>[],
  ) {
    if (populate.includes('components')) {
      training.components = await this.trainingComponentRepository.getDocs(ref);

      if (populate.includes('components.component')) {
        await Promise.all(
          training.components.map(async (component) => {
            component.component =
              await this.componentService.findOneBySlugOrFail(
                component.componentId,
              );
          }),
        );
      }

      if (populate.includes('components.supersets')) {
        await Promise.all(
          training.components.map(async (component) => {
            const componentRef = {
              ...ref,
              componentId: component.componentId,
            };

            component.supersets =
              await this.trainingSupersetRepository.getDocs(componentRef);

            if (populate.includes('components.supersets.exercises'))
              await Promise.all(
                component.supersets.map(async (superset) => {
                  const supersetRef = {
                    ...ref,
                    componentId: component.componentId,
                    supersetId: superset.id,
                  };

                  superset.exercises =
                    await this.trainingExerciseRepository.getDocs(supersetRef);

                  if (
                    populate.includes('components.supersets.exercises.exercise')
                  )
                    await Promise.all(
                      superset.exercises.map(async (exercise) => {
                        exercise.exercise = await this.exerciseService.findOne({
                          ...ref,
                          exerciseId: exercise.exerciseId,
                        });
                      }),
                    );

                  if (
                    populate.includes('components.supersets.exercises.data')
                  ) {
                    // TODO: populate exercise data
                  }
                }),
              );
          }),
        );
      }
    }

    if (populate.includes('subgroup') && training.subgroupId) {
      training.subgroup = await this.subgroupRepository.getDoc({
        ...ref,
        groupId: training.groupId,
        subgroupId: training.subgroupId,
      });
    }
  }

  private async validate(
    userId: string,
    group: Group,
    data: CreateTraining,
  ): Promise<Validate> {
    const components = await this.componentService.findAllFlat({
      filter: {
        ...(data.componentIds.length > 0 && { ids: data.componentIds }),
      },
    });

    if (components.length !== data.componentIds.length)
      return { error: true, message: 'Some components do not exist' };

    // check that user is owner of the group
    if (!this.groupService.isOwner(userId, group))
      return {
        error: true,
        message: 'You are not authorized to perform this action',
      };

    // check that subgroup exists within cycle's parent group
    if (data.subgroupId) {
      const subgroup = await this.subgroupService.findOne({
        groupId: group.id,
        subgroupId: data.subgroupId,
      });

      if (!subgroup) return { error: true, message: 'Subgroup does not exist' };
    }

    return { error: false };
  }

  private isAuthorized(user: User, training: Training): boolean {
    return (
      training.ownerId === user.uid || training.membersIds.includes(user.uid)
    );
  }
}
