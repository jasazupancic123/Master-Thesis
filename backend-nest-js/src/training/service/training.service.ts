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
import { CommonService } from '../../common/service/common.service';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
  Populate,
} from '../../common/type/orm.type';
import { Cycle } from '../../group/entity/cycle.entity';
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
  CycleRef,
  GroupRef,
  SubgroupRef,
  TrainingComponentRef,
  TrainingExerciseRef,
  TrainingRef,
  TrainingSupersetRef,
} from '../../common/type/firebase-firestore.type';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { CycleService } from '../../group/service/cycle.service';
import { SubgroupService } from '../../group/service/subgroup.service';
import { TrainingSupersetRepository } from '../repository/training-superset.repository';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { TrainingSupersetService } from './training-superset.service';
import {
  CreateTrainingExercise,
  UpdateTrainingExercise,
} from '../type/training-exercise.type';
import { CreateTrainingSuperset } from '../type/training-superset.type';
import { CreateTrainingComponent } from '../type/training-component.type';
import { Component } from '../../component/entity/component.entity';
import { CreateTraining } from '../type/training.type';
import { GroupRepository } from '../../group/repository/group.repository';
import { TrainingExerciseUserDataService } from './training-exercise-user-data.service';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingComponentRepository: TrainingComponentRepository,
    private readonly trainingSupersetRepository: TrainingSupersetRepository,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    private readonly groupRepository: GroupRepository,
    @Inject(forwardRef(() => SubgroupService))
    private readonly subgroupService: Wrapper<SubgroupService>,
    @Inject(forwardRef(() => CycleService))
    private readonly cycleService: Wrapper<CycleService>,
    private readonly subgroupRepository: SubgroupRepository,
    private readonly trainingExerciseService: TrainingExerciseService,
    private readonly trainingComponentService: TrainingComponentService,
    private readonly trainingSupersetService: TrainingSupersetService,
    private readonly trainingExerciseUserDataService: TrainingExerciseUserDataService,
  ) {}

  async findOne(
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training> & { authorize?: boolean },
  ): Promise<Training | null> {
    // find parent references
    const cycle = await this.cycleService.findOneOrFail(ref, {
      authorize: options?.authorize,
    });

    // find training
    const training = await this.trainingRepository.getDoc(ref);
    if (!training) return null;

    if (options?.populate) await this.populate(ref, training, options.populate);
    training.cycle = cycle;
    return training;
  }

  async findOneOrFail(
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training> & { authorize?: boolean },
  ): Promise<Training> {
    const training = await this.findOne(ref, options);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findAll(
    ref: Required<CycleRef>,
    options?: FindManyOptions<Training> & { authorize?: boolean },
  ): Promise<Training[]> {
    await this.cycleService.findOneOrFail(ref, {
      authorize: options?.authorize,
    });

    const trainings = await this.trainingRepository.getDocs(
      ref,
      (collection) => {
        let query = collection;
        if (options?.filter) query = this.filter(query, options.filter);
        if (options?.paginate) query = this.paginate(query, options.paginate);

        return query;
      },
    );

    if (options?.populate)
      await Promise.all(
        trainings.map(async (training) => {
          const trainingRef = {
            ...ref,
            trainingId: training.id,
            subgroupId: null,
          };

          await this.populate(trainingRef, training, options.populate);
        }),
      );

    return trainings;
  }

  async findAllByGroup(
    ref: Required<GroupRef>,
    options?: FindManyOptions<Training> & { authorize?: boolean },
  ): Promise<Training[]> {
    const group = await this.groupService.findOneOrFail(ref, {
      authorize: options?.authorize,
      populate: ['cycles', 'cycles.trainings'],
    });

    // populate trainings
    if (options?.populate)
      await Promise.all(
        group.cycles.map(({ id, trainings }) => {
          trainings.map(async (training) => {
            const trainingRef = {
              ...ref,
              cycleId: id,
              trainingId: training.id,
              subgroupId: null,
            };

            await this.populate(trainingRef, training, options.populate);
          });
        }),
      );

    return group.cycles.reduce((acc, cycle) => acc.concat(cycle.trainings), []);
  }

  /**
   * Finds all training by member for the given cycle reference. Each member
   * can be part of the main (parent) group and many subgroups and each subgroup
   * can have different trainings than the main group.
   *
   * Flow:
   * 1. Find all trainings for the main group
   * 2. Find all subgroups for the given cycle that member is part of.
   * 3. Filter all subgroup trainings from the main group and remember their
   *    `copiedFromId` field.
   * 4. Ignore all trainings in the parent group that have been copied.
   * 5. The result is a list of trainings that are part of the main group and
   *    subgroups that member is part of.
   */
  async findAllByMember(
    ref: Required<CycleRef>,
    memberId: string,
    options?: FindManyOptions<Training>,
  ): Promise<Training[]> {
    // parent group trainings
    const trainings = await this.findAll(ref, { filter: options?.filter });

    // find all subgroups that user is part of in the given cycle
    let query = this.groupRepository
      .subgroupsCollectionGroup()
      .where('groupId', '==', ref.groupId)
      .where('membersIds', 'array-contains', memberId);

    if (options?.filter) {
      const { from, to } = options.filter;
      if (from && to)
        query = query
          .where('from', '>=', Timestamp.fromDate(from.value))
          .where('to', '<=', Timestamp.fromDate(to.value));
      else if (from)
        query = query.where(
          'from',
          from.op || '>=',
          Timestamp.fromDate(from.value),
        );
      else if (to)
        query = query.where('to', to.op || '<=', Timestamp.fromDate(to.value));
    }

    const subgroups = (await query.get()).docs.map((doc) =>
      this.subgroupRepository.serialize(doc),
    );

    /*const cycle = await this.cycleService.findOneOrFail(ref, {
      authorize: true,
      populate: ['subgroups'],
    });

    const subgroups = cycle.subgroups.filter((subgroup) =>
      this.groupService.isMember(memberId, subgroup),
    );*/

    // find all subgroup trainings
    const subgroupTrainings = trainings.filter((training) =>
      subgroups.some((subgroup) => training.subgroupId === subgroup.id),
    );

    // find all trainings that have been copied from subgroup trainings
    const ignoreTrainingsIds = subgroupTrainings.map(
      (training) => training.copiedFromId,
    );

    let memberTrainings = trainings
      .filter((training) => !training.subgroupId) // keep only parent trainings
      .filter(
        (training) => !ignoreTrainingsIds.includes(training.id), // ignore copied trainings
      )
      .concat(subgroupTrainings)
      .sort((a, b) => a.from.getTime() - b.from.getTime());

    // custom filter
    if (options?.filter) {
      memberTrainings = memberTrainings.filter((training) => {
        if (options.filter.from && options.filter.to)
          return this.commonService.date.isBetween(
            training.from,
            options.filter.from.value,
            options.filter.to.value,
          );

        if (options.filter.from) {
          if (options.filter.from.op === '<=' || options.filter.from.op === '<')
            return this.commonService.date.isBefore(
              training.from,
              options.filter.from.value,
            );

          if (options.filter.from.op === '>=' || options.filter.from.op === '>')
            return this.commonService.date.isAfter(
              training.from,
              options.filter.from.value,
            );
        }

        if (options.filter.to) {
          if (options.filter.to.op === '<=' || options.filter.to.op === '<')
            return this.commonService.date.isBefore(
              training.to,
              options.filter.to.value,
            );

          if (options.filter.to.op === '>=' || options.filter.to.op === '>')
            return this.commonService.date.isAfter(
              training.to,
              options.filter.to.value,
            );
        }

        return true;
      });
    }

    // populate trainings
    if (options?.populate)
      await Promise.all(
        memberTrainings.map(async (training) => {
          const trainingRef = {
            ...ref,
            trainingId: training.id,
            subgroupId: null,
          };

          await this.populate(trainingRef, training, options.populate);
        }),
      );

    return memberTrainings;
  }

  async create(
    ref: Required<CycleRef>,
    input: CreateTraining,
  ): Promise<Training> {
    this.logger.debug(
      `Creating training (user ${ref.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    const cycle = await this.cycleService.findOne(ref, {
      authorize: true,
    });

    // validate data
    await this.componentService.findAllOrFail({
      filter: {
        ...(input.componentIds.length > 0 && { ids: input.componentIds }),
      },
    });

    const data = {
      subgroupId: input.subgroupId || null,
      from: input.from,
      to: input.to,
    };

    const { error, message } = await this.validate(ref.uid, cycle, data);
    if (error) throw new BadRequestException(message);

    // create training
    const trainingId = await this.trainingRepository.addDoc(ref, data);

    // create training components
    const trainingRef = { ...ref, trainingId, subgroupId: data.subgroupId };
    const training = await this.findOneOrFail(trainingRef);

    training.components = await this.trainingComponentService.createMany(
      trainingRef,
      input.componentIds.map((componentId) => ({ componentId })),
    );

    return training;
  }

  async copy(
    source: Required<TrainingRef>,
    destination: Required<CycleRef & SubgroupRef>,
  ): Promise<Training> {
    this.logger.debug(
      `Copying training ${source.trainingId} (user ${source.uid})`,
    );

    if (source.uid !== destination.uid)
      throw new UnauthorizedException(
        'You are not authorized to copy training',
      );

    // copy all training data from source to destination
    const sourceTraining = await this.findOneOrFail(source, {
      authorize: true,
      populate: [
        'components',
        'components.supersets',
        'components.supersets.exercises',
      ],
    });

    const destinationCycle = await this.cycleService.findOneOrFail(
      destination,
      { authorize: true },
    );

    const destinationSubgroup = destination.subgroupId
      ? await this.subgroupService.findOneOrFail(destination)
      : null;

    // validate that user is authorized to create training for the destination
    // group and cycle with given training data
    const data = {
      subgroupId: destinationSubgroup?.id || null,
      copiedFromId: sourceTraining.id,
      from: sourceTraining.from,
      to: sourceTraining.to,
    };

    const { error, message } = await this.validate(
      source.uid,
      destinationCycle,
      data,
    );

    if (error) throw new BadRequestException(message);

    // create new training with the same data as the source
    const trainingId = await this.trainingRepository.addDoc(destination, data);

    // create training components
    const componentRef = { ...destination, trainingId, subgroupId: null };
    const components = await this.trainingComponentService.createMany(
      componentRef,
      sourceTraining.components.map((component) => ({
        componentId: component.componentId,
        color: component.color,
        supersets: component.supersets.map((superset) => ({
          color: superset.color,
          exercises: superset.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            meta: exercise.meta,
            color: exercise.color,
          })),
        })),
      })),
    );

    return {
      id: trainingId,
      ...data,
      components,
      cycle: destinationCycle,
      subgroup: destinationSubgroup,
      from: data.from,
      to: data.to,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update() {
    // TODO
  }

  async remove() {
    // TODO
  }

  /**
   * For trainer to add components to the training.
   */
  async addComponents(
    ref: Required<TrainingRef>,
    input: CreateTrainingComponent[],
  ): Promise<TrainingComponent[]> {
    this.logger.debug(
      `Adding component to training (user ${ref.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    const training = await this.findOneOrFail(ref, {
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

  async updateComponent() {
    // TODO
  }

  async removeComponent() {
    // TODO
  }

  /**
   * For trainer to add supersets to training component.
   */
  async addSuperset(
    ref: Required<TrainingComponentRef>,
    input: CreateTrainingSuperset,
  ): Promise<TrainingSuperset> {
    this.logger.debug(
      `Adding superset to training (user ${ref.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    await this.findOneOrFail(ref, { authorize: true });
    const component = await this.trainingComponentRepository.getDoc(ref);
    if (!component)
      throw new BadRequestException('Training component not found');

    // validate exercises
    if (input.exercises?.length) {
      const exerciseIds = input.exercises.map((e) => e.exerciseId);
      const exercises = await this.exerciseService.findAll(ref, {
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

  async updateSuperset() {
    // TODO
  }

  async removeSuperset() {
    // TODO
  }

  /**
   * For trainer to add exercises to training superset
   */
  async addExercises(
    ref: Required<TrainingSupersetRef>,
    input: CreateTrainingExercise[],
  ): Promise<TrainingExercise[]> {
    this.logger.debug(
      `Adding exercise to training (user ${ref.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    await this.findOneOrFail(ref, { authorize: true });
    const superset = await this.trainingSupersetRepository.getDoc(ref);
    if (!superset) throw new BadRequestException('Training superset not found');

    // find all exercises
    const exerciseIds = input.map((e) => e.exerciseId);
    const exercises = await this.exerciseService.findAll(ref, {
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

  /**
   * For trainer to update training exercise and its exercise data.
   */
  async updateExercise(
    ref: Required<TrainingExerciseRef>,
    input: UpdateTrainingExercise,
  ): Promise<TrainingExercise> {
    this.logger.debug(
      `Updating exercise in training (user ${ref.uid}): ${JSON.stringify(input)}`,
    );

    // find parent references
    await this.findOneOrFail(ref, { authorize: true });
    const trainingExercise = await this.trainingExerciseRepository.getDoc(ref);
    if (!trainingExercise)
      throw new BadRequestException('Training exercise not found');

    // make sure user has access to the exercise
    const exerciseRef = { exerciseId: trainingExercise.exerciseId };
    const exercise = await this.exerciseService.findOneOrFail(exerciseRef, {
      userId: ref.uid,
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

  /**
   * For trainer to remove exercise from training superset.
   */
  async removeExercise(ref: Required<TrainingExerciseRef>): Promise<void> {
    this.logger.debug(`Removing exercise from training (user ${ref.uid})`);
    // TODO
  }

  private filter(query: Query, filter: Filter<Training>) {
    if (filter.ids) query = query.where('id', 'in', filter.ids);
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
        subgroupId: training.subgroupId,
      });
    }
  }

  private async validate(
    userId: string,
    cycle: Cycle,
    data: Partial<Training>,
  ): Promise<Validate> {
    // check that user is owner of the group
    if (!this.groupService.isOwner(userId, cycle.group))
      return {
        error: true,
        message: 'You are not authorized to create training for this cycle',
      };

    // check that subgroup exists within cycle's parent group
    const subgroupRef = {
      uid: userId,
      groupId: cycle.group.id,
      subgroupId: data.subgroupId,
    };

    if (data.subgroupId) await this.subgroupService.findOneOrFail(subgroupRef);

    // check time
    if (!this.commonService.date.isBetween(data.from, cycle.from, cycle.to))
      return {
        error: true,
        message: 'Training must be within cycle start and end date',
      };

    return { error: false };
  }
}
