import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../../common/type/firebase-auth.type';
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
import { Group } from '../../group/entity/group.entity';
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
import { CanViewService } from '../../common/type/auth.type';
import { TrainingSupersetRepository } from '../repository/training-superset.repository';
import { TrainingSuperset } from '../entity/training-superset.entity';
import { TrainingSupersetService } from './training-superset.service';

@Injectable()
export class TrainingService extends CanViewService<GroupRef> {
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
  ) {
    super();
  }

  async canView(user: User, ref: Required<GroupRef>): Promise<boolean> {
    return await this.groupService.canView(user, ref);
  }

  async findTraining(
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training>,
  ): Promise<Training | null> {
    const training = await this.trainingRepository.getDoc(ref);
    if (!training) return null;

    if (options?.populate) await this.populate(ref, training, options.populate);
    return training;
  }

  async findTrainingOrFail(
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training>,
  ): Promise<Training> {
    const training = await this.findTraining(ref, options);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findUserTraining(
    user: User,
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training>,
  ): Promise<Training | null> {
    await this.authorize(user, ref);
    return (await this.findTraining(ref, options)) || null;
  }

  async findUserTrainingOrFail(
    user: User,
    ref: Required<TrainingRef>,
    options?: FindOneOptions<Training>,
  ): Promise<Training> {
    const training = await this.findUserTraining(user, ref, options);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findTrainingComponent(
    ref: Required<TrainingComponentRef>,
  ): Promise<TrainingComponent> {
    return await this.trainingComponentRepository.getDoc(ref);
  }

  async findTrainingComponents(
    ref: Required<TrainingRef>,
  ): Promise<TrainingComponent[]> {
    return await this.trainingComponentRepository.getDocs(ref);
  }

  async findTrainingSuperset(
    ref: Required<TrainingSupersetRef>,
  ): Promise<TrainingSuperset> {
    return await this.trainingSupersetRepository.getDoc(ref);
  }

  async findTrainingSupersetOrFail(
    ref: Required<TrainingSupersetRef>,
  ): Promise<TrainingSuperset> {
    const superset = await this.findTrainingSuperset(ref);
    if (!superset) throw new BadRequestException('Training superset not found');
    return superset;
  }

  async findTrainingExercise(
    ref: Required<TrainingExerciseRef>,
  ): Promise<TrainingExercise> {
    return await this.trainingExerciseRepository.getDoc(ref);
  }

  async findTrainings(
    ref: Required<CycleRef>,
    options?: FindManyOptions<Training>,
  ): Promise<Training[]> {
    const trainings = await this.trainingRepository.getDocs(
      ref,
      (collection) => {
        let query = collection;
        if (options?.filter) query = this.filter(collection, options.filter);
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

  async findTrainingsByAthlete(
    user: User,
    ref: Required<CycleRef>,
  ): Promise<Training[]> {
    // get athlete's current active cycle
    const group = await this.groupService.findUserGroup(user, ref);
    const cycle = await this.cycleService.findActiveCycle(ref, new Date());
    if (!cycle) return [];

    // find all active subgroups that user is part of
    const subgroups = group.subgroups
      .filter(({ from, to }) =>
        this.commonService.date.isBetween(new Date(), from, to),
      )
      .filter((subgroup) => this.groupService.isMember(user, subgroup));

    /* all subgroups have `from` and `to` fields which indicate the date range
    for which the subgroup is valid and each subgroup has unique dates so there
    is no overlap between subgroups. Now, we get the union of all subgroup dates
    and return their trainings, and for the dates that are not in the union,
    return the parent group trainings. */
    const range = this.commonService.date.negateRange(
      subgroups.map(({ from, to }) => [from, to]),
    ); // range for parent group trainings
    const parentTrainings = await this.findTrainings(ref);

    // find all active cycle trainings where subgroupId is null or user is part of the subgroup
    // and filter by date range
    const subgroupsTrainings = await this.findTrainings(ref, {
      filter: {
        subgroupId: {
          value: subgroups.map(({ id }) => id),
        },
      },
    });

    const trainings = subgroupsTrainings
      .concat(parentTrainings)
      .sort((a, b) => a.from.getTime() - b.from.getTime());

    const athleteTrainings = trainings.filter((training) => {
      if (training.subgroupId) return true;
      return range.some(([from, to]) =>
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
        await this.populate(trainingRef, training, []);
        return training;
      }),
    );
  }

  async createTraining(
    user: User,
    ref: Required<CycleRef>,
    input: Partial<Training> & {
      componentIds: string[];
    },
  ): Promise<Training> {
    this.logger.debug(
      `Creating training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    await this.authorize(user, ref);

    // find parent references (group and cycle)
    const group = await this.groupService.findGroup(ref);
    const cycle = await this.cycleService.findCycle(ref);

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

    const { error, message } = await this.validate(user, group, cycle, data);
    if (error) throw new BadRequestException(message);

    // create training
    const trainingId = await this.trainingRepository.addDoc(ref, data);

    // create training components
    const trainingRef = { ...ref, trainingId, subgroupId: data.subgroupId };
    const training = await this.findTrainingOrFail(trainingRef);
    training.components = await this.trainingComponentService.createMany(
      trainingRef,
      input.componentIds.map((componentId, order) => ({ componentId, order })),
    );

    return training;
  }

  async copyTraining(
    user: User,
    source: Required<TrainingRef>,
    destination: Required<CycleRef & SubgroupRef>,
  ): Promise<Training> {
    this.logger.debug(
      `Copying training ${source.trainingId} (user ${user.uid})`,
    );

    await this.authorize(user, source);
    if (source.uid !== destination.uid)
      throw new UnauthorizedException(
        'You are not authorized to copy training',
      );

    // copy all training data from source to destination
    const sourceTraining = await this.findTrainingOrFail(source, {
      populate: ['components'],
    });

    const destinationGroup = await this.groupService.findGroup(destination);
    const destinationCycle = await this.cycleService.findCycle(destination);
    const destinationSubgroup = destination.subgroupId
      ? await this.subgroupService.findSubgroupOrFail(destination)
      : null;

    // validate that user is authorized to create training for the destination group and cycle with given training data
    const data = {
      subgroupId: destinationSubgroup?.id || null,
      from: sourceTraining.from,
      to: sourceTraining.to,
    };

    const { error, message } = await this.validate(
      user,
      destinationGroup,
      destinationCycle,
      data,
    );

    if (error) throw new BadRequestException(message);

    // create new training with the same data as the source
    const trainingId = await this.trainingRepository.addDoc(destination, data);

    // create training components
    const componentRef = { ...destination, trainingId };
    const training = await this.findTrainingOrFail(componentRef);
    training.components = await this.trainingComponentService.createMany(
      componentRef,
      sourceTraining.components,
    );

    return training;
  }

  async findUserTrainingComponent(
    user: User,
    ref: Required<TrainingComponentRef>,
  ): Promise<TrainingComponent> {
    await this.groupService.findUserGroup(user, ref);
    await this.cycleService.findUserCycle(user, ref);
    await this.findTrainingOrFail(ref);
    return await this.findTrainingComponent(ref);
  }

  async addComponent(
    user: User,
    ref: Required<TrainingRef>,
    input: Partial<TrainingComponent>,
  ) {
    this.logger.debug(
      `Adding component to training (user ${user.uid}): ${JSON.stringify(input)}`,
    );
    await this.authorize(user, ref);

    // find parent references (group, cycle, training)
    const training = await this.findTrainingOrFail(ref, {
      populate: ['components'],
    });

    // validate data
    await this.componentService.findOneBySlugOrFail(input.componentId);
    if (
      training.components.map((c) => c.componentId).includes(input.componentId)
    )
      throw new BadRequestException('Component already exists in the training');

    // create training component
    const data = {
      componentId: input.componentId,
      order: input.order || training.components.length,
      color: input.color || this.commonService.color.random(),
    };

    const componentRef = { ...ref, componentId: input.componentId };
    await this.trainingComponentRepository.addDoc(componentRef, data);

    // populate training component
    training.components = [
      ...(training.components || []),
      { ...data, component: null, supersets: [] },
    ];
    return training;
  }

  async findUserTrainingExercise(
    user: User,
    ref: Required<TrainingExerciseRef>,
  ): Promise<TrainingExercise> {
    await this.authorize(user, ref);
    return await this.findTrainingExercise(ref);
  }

  async addSuperset(
    user: User,
    ref: Required<TrainingComponentRef>,
    input: Partial<TrainingSuperset>,
  ): Promise<TrainingSuperset> {
    this.logger.debug(
      `Adding superset to training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    await this.authorize(user, ref);

    // find parent references (group, cycle, training, component)
    const component = await this.findTrainingComponent(ref);
    component.supersets = await this.trainingSupersetRepository.getDocs(ref);

    // create training superset
    const data = {
      order: input.order || component.supersets.length,
      color: input.color || this.commonService.color.random(),
      exercises: input.exercises || [],
    };

    const supersets = await this.trainingSupersetService.createMany(ref, [
      data,
    ]);

    return supersets?.[0] || null;
  }

  async addExercise(
    user: User,
    ref: Required<TrainingSupersetRef>,
    input: Partial<TrainingExercise>,
  ): Promise<TrainingExercise | null> {
    this.logger.debug(
      `Adding exercise to training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    await this.authorize(user, ref);
    if (!input.exerciseId)
      throw new BadRequestException('Exercise ID is required');

    // find parent references (group, cycle, training, component)
    const superset = await this.findTrainingSupersetOrFail(ref);
    superset.exercises = await this.trainingExerciseRepository.getDocs(ref);
    input.order = superset.exercises.length;

    // validate data
    const exercises = await this.exerciseService.findExercises(ref, {
      filter: { ids: [input.exerciseId] },
    });

    const { error, message } = await this.exerciseService.validateExercises(
      ref.componentId,
      exercises,
    );

    if (error) throw new BadRequestException(message);

    // add exercises to training component
    const trainingExercises = await this.trainingExerciseService.createMany(
      ref,
      [input],
    );

    const trainingExercise = trainingExercises?.[0] || null;
    if (!trainingExercise) return null;

    // populate exercise
    trainingExercise.exercise = exercises[0];
    return trainingExercise;
  }

  async updateExercise(
    user: User,
    ref: Required<TrainingExerciseRef>,
    input: Partial<TrainingExercise>,
  ): Promise<TrainingExercise> {
    this.logger.debug(
      `Updating exercise in training (user ${user.uid}): ${JSON.stringify(input)}`,
    );

    await this.authorize(user, ref);

    // find parent references (group, cycle, training, component, exercise)
    const trainingExercise = await this.findTrainingExercise(ref);
    const exercise = await this.exerciseService.findUserExerciseOrFail(user, {
      ...ref,
      exerciseId: trainingExercise.exerciseId,
    });

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
                        exercise.exercise =
                          await this.exerciseService.findExercise({
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
    user: User,
    group: Group,
    cycle: Cycle,
    data: Partial<Training>,
  ): Promise<Validate> {
    // check that user is owner of the group
    if (!this.groupService.isOwner(user, group))
      return {
        error: true,
        message: 'You are not authorized to create training for this cycle',
      };

    // check that subgroup exists within cycle's parent group
    const subgroupRef = {
      uid: user.uid,
      groupId: group.id,
      subgroupId: data.subgroupId,
    };

    const subgroup = data.subgroupId
      ? await this.subgroupService.findSubgroupOrFail(subgroupRef)
      : null;

    // check time
    if (!this.commonService.date.isBetween(data.from, cycle.from, cycle.to))
      return {
        error: true,
        message: 'Training must be within cycle start and end date',
      };

    return { error: false };
  }
}
