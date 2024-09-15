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
    @Inject(forwardRef(() => SubgroupService))
    private readonly subgroupService: Wrapper<SubgroupService>,
    @Inject(forwardRef(() => CycleService))
    private readonly cycleService: Wrapper<CycleService>,
    private readonly subgroupRepository: SubgroupRepository,
    private readonly trainingExerciseService: TrainingExerciseService,
    private readonly trainingComponentService: TrainingComponentService,
    private readonly trainingSupersetService: TrainingSupersetService,
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

  async findAllByMember(
    userId: string,
    options?: FindManyOptions<Training>,
  ): Promise<Training[]> {
    // get athlete's current active cycle
    const cycle = await this.cycleService.findActiveCycle(userId, new Date());
    if (!cycle) return [];

    // console.log('active cycle:', cycle);

    // find all active subgroups that user is part of
    const subgroups = (
      await this.subgroupService.findAllActive({
        uid: cycle.group.ownerId,
        groupId: cycle.group.id,
      })
    ).filter((subgroup) => this.groupService.isMember(userId, subgroup));

    // console.log('subgroups:', subgroups);

    /* all subgroups have `from` and `to` fields which indicate the date range
    for which the subgroup is valid and each subgroup has unique dates so there
    is no overlap between subgroups. Now, we get the union of all subgroup dates
    and return their trainings, and for the dates that are not in the union,
    return the parent group trainings. */
    const range = [
      [cycle.group.from, cycle.group.to],
      ...subgroups.map(({ from, to }) => [from, to]),
    ].sort((a, b) => a[0].getTime() - b[0].getTime());

    const negated = this.commonService.date.negateRange(range); // range for parent group trainings

    console.log('range:', range);
    console.log('negated:', negated);

    const ref = {
      uid: cycle.group.ownerId,
      groupId: cycle.group.id,
      cycleId: cycle.id,
    };

    const parentTrainings = await this.findAll(ref);

    // find all active cycle trainings where subgroupId is null or user is part
    // of the subgroup and filter by date range
    const subgroupsTrainings = await this.findAll(ref, {
      filter: {
        ...(subgroups.length && {
          subgroupId: {
            value: subgroups.map(({ id }) => id),
          },
        }),
      },
    });

    const trainings = subgroupsTrainings
      .concat(parentTrainings)
      .sort((a, b) => a.from.getTime() - b.from.getTime());

    const athleteTrainings = trainings.filter((training) => {
      if (training.subgroupId) return true;
      return negated.some(([from, to]) =>
        this.commonService.date.isBetween(training.from, from, to),
      );
    });

    // populate trainings' components and exercises
    return await Promise.all(
      athleteTrainings.map(async (training) => {
        const trainingRef = {
          ...ref,
          trainingId: training.id,
          subgroupId: training.subgroupId,
        };

        if (options?.populate)
          await this.populate(trainingRef, training, options.populate);

        return training;
      }),
    );
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
