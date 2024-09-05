import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../common/type/firebase-auth.type';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { Training } from './entity/training.entity';
import { ComponentService } from '../component/component.service';
import { ExerciseService } from '../exercise/exercise.service';
import { CommonService } from '../common/service/common.service';
import { Filter, FindManyOptions, FindOneOptions, PaginateOptions } from '../common/type/orm.type';
import { Cycle } from '../group/entity/cycle.entity';
import { Validate } from '../common/type/validate.type';
import { Group } from '../group/entity/group.entity';
import { GroupService } from '../group/group.service';
import { TrainingComponent } from './entity/training-component.entity';
import { TrainingExercise } from './entity/training-exercise.entity';
import { Wrapper } from '../common/type/wrapper.type';
import { TrainingRepository } from './repository/training.repository';
import { TrainingComponentRepository } from './repository/training-component.repository';
import { TrainingExerciseRepository } from './repository/training-exercise.repository';
import { SubgroupRepository } from '../group/repository/subgroup.repository';
import { TrainingExerciseService } from './service/training-exercise.service';
import { TrainingComponentService } from './service/training-component.service';
import {
  CycleRef,
  TrainingComponentRef,
  TrainingExerciseRef,
  TrainingRef,
} from '../common/type/firebase-firestore.type';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingComponentRepository: TrainingComponentRepository,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    private readonly subgroupRepository: SubgroupRepository,
    private readonly trainingExerciseService: TrainingExerciseService,
    private readonly trainingComponentService: TrainingComponentService,
  ) {
  }

  async findTraining(ref: Required<TrainingRef>, options?: FindOneOptions<Training>): Promise<Training | null> {
    const training = await this.trainingRepository.getDoc(ref);
    await this.populate(ref, training, options);
    return training;
  }

  async findTrainingOrFail(ref: Required<TrainingRef>, options?: FindOneOptions<Training>): Promise<Training> {
    const training = await this.findTraining(ref, options);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findUserTraining(user: User, ref: Required<TrainingRef>, options?: FindOneOptions<Training>): Promise<Training | null> {
    await this.groupService.findOneByIdOrFail(user, ref.groupId);
    await this.groupService.findCycleByIdOrFail(user, { groupId: ref.groupId, cycleId: ref.cycleId });
    return await this.findTraining(ref, options) || null;
  }

  async findUserTrainingOrFail(user: User, ref: Required<TrainingRef>, options?: FindOneOptions<Training>): Promise<Training> {
    const training = await this.findUserTraining(user, ref, options);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findTrainingComponent(ref: Required<TrainingComponentRef>): Promise<TrainingComponent> {
    return await this.trainingComponentRepository.getDoc(ref);
  }

  async findTrainingComponents(ref: Required<TrainingRef>): Promise<TrainingComponent[]> {
    return await this.trainingComponentRepository.getDocs(ref);
  }

  async findTrainingExercise(ref: Required<TrainingExerciseRef>): Promise<TrainingExercise> {
    return await this.trainingExerciseRepository.getDoc(ref);
  }

  async findTrainings(ref: Required<CycleRef>, options?: FindManyOptions<Training>): Promise<Training[]> {
    return await this.trainingRepository.getDocs(ref, (collection) => {
      let query = this.filter(collection, options?.filter);
      return this.paginate(query, options?.paginate);
    });
  }

  async findTrainingsByAthlete(user: User, ref: Required<CycleRef>): Promise<Training[]> {
    // get athlete's current active cycle
    const group = await this.groupService.findOneByIdOrFail(user, ref.groupId);
    const cycle = await this.groupService.findActiveCycle(user, {
      groupId: ref.groupId,
      cycleId: ref.cycleId,
    }, new Date());
    if (!cycle) return [];

    // find all active subgroups that user is part of
    const subgroups = group.subgroups
      .filter(({ from, to }) => this.commonService.date.isBetween(new Date(), from, to))
      .filter((subgroup) => this.groupService.isMember(user, subgroup));

    /* all subgroups have `from` and `to` fields which indicate the date range
    for which the subgroup is valid and each subgroup has unique dates so there
    is no overlap between subgroups. Now, we get the union of all subgroup dates
    and return their trainings, and for the dates that are not in the union,
    return the parent group trainings. */
    const range = this.commonService.date.negateRange(subgroups.map(({ from, to }) => [from, to])); // range for parent group trainings
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
        this.commonService.date.isBetween(training.from, from, to));
    });

    // populate trainings' components and exercises
    return await Promise.all(
      athleteTrainings.map(async (training) => {
        await this.populate({ ...ref, trainingId: training.id }, training);
        return training;
      }),
    );
  }

  async createTraining(user: User, ref: Required<CycleRef>, input: Partial<Training> & {
    componentIds: string[]
  }): Promise<Training> {
    this.logger.debug(`Creating training (user ${user.uid}): ${JSON.stringify(input)}`);

    // find parent references (group and cycle)
    const group = await this.groupService.findOneByIdOrFail(user, ref.groupId);
    const cycle = await this.groupService.findCycleByIdOrFail(user, ref);

    // validate data
    await this.componentService.findAllOrFail({ ids: input.componentIds || [] });
    const data = { subgroupId: input.subgroupId || null, from: input.from, to: input.to };
    const { error, message } = await this.validate(user, group, cycle, data);
    if (error) throw new BadRequestException(message);

    // create training
    const trainingId = await this.trainingRepository.addDoc(ref, data);

    // create training components
    const trainingRef = { ...ref, trainingId };
    const training = await this.findTrainingOrFail(trainingRef);
    training.components = await this.trainingComponentService.createMany(trainingRef, input.componentIds.map(
      (componentId, order) => ({ componentId, order }),
    ));

    return training;
  }

  async copyTraining(user: User, source: Required<TrainingRef>, destination: Required<CycleRef>): Promise<Training> {
    this.logger.debug(`Copying training ${source.trainingId} (user ${user.uid})`);

    // copy all training data from source to destination
    const sourceTraining = await this.findUserTrainingOrFail(user, source, { populate: ['components'] });
    const destinationGroup = await this.groupService.findOneByIdOrFail(user, destination.groupId);
    const destinationCycle = await this.groupService.findCycleByIdOrFail(user, destination);
    const destinationSubgroup = destination.subgroupId ? await this.groupService.findSubgroupOrFail(user, destination) : null;

    // validate that user is authorized to create training for the destination group and cycle with given training data
    const data = { subgroupId: destinationSubgroup?.id || null, from: sourceTraining.from, to: sourceTraining.to };
    const { error, message } = await this.validate(user, destinationGroup, destinationCycle, data);
    if (error) throw new BadRequestException(message);

    // create new training with the same data as the source
    const trainingId = await this.trainingRepository.addDoc(destination, data);

    // create training components
    const componentRef = { ...destination, trainingId };
    const training = await this.findTrainingOrFail(componentRef);
    training.components = await this.trainingComponentService.createMany(componentRef, sourceTraining.components);

    return training;
  }

  async findUserTrainingComponent(user: User, ref: Required<TrainingComponentRef>): Promise<TrainingComponent> {
    await this.groupService.findOneByIdOrFail(user, ref.groupId);
    await this.groupService.findCycleByIdOrFail(user, ref);
    await this.findTrainingOrFail(ref);
    return await this.findTrainingComponent(ref);
  }

  async addComponent(user: User, ref: Required<TrainingRef>, input: Partial<TrainingComponent>) {
    this.logger.debug(`Adding component to training (user ${user.uid}): ${JSON.stringify(input)}`);

    // find parent references (group, cycle, training)
    const training = await this.findUserTrainingOrFail(user, ref, { populate: ['components'] });

    // validate data
    await this.componentService.findOneByIdOrFail(input.componentId);
    if (training.components.map(c => c.componentId).includes(input.componentId))
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
    training.components = [...training.components || [], { ...data, component: null, exercises: [] }];
    return training;
  }

  async findUserTrainingExercise(user: User, ref: Required<TrainingExerciseRef>): Promise<TrainingExercise> {
    await this.groupService.findOneByIdOrFail(user, ref.groupId);
    await this.groupService.findCycleByIdOrFail(user, ref);
    await this.findTrainingOrFail(ref);
    await this.findTrainingComponent(ref);
    return await this.findTrainingExercise(ref);
  }

  async addExercise(
    user: User,
    ref: Required<TrainingComponentRef>,
    input: Partial<TrainingExercise>,
  ): Promise<TrainingComponent> {
    this.logger.debug(`Adding exercise to training (user ${user.uid}): ${JSON.stringify(input)}`);

    // find parent references (group, cycle, training, component)
    const component = await this.findUserTrainingComponent(user, ref);

    // validate data
    const exercises = await this.exerciseService.findAllOrFail(user, { filter: { ids: [input.exerciseId] } });
    const { error, message } = await this.exerciseService.validate(component.componentId, exercises);
    if (error) throw new BadRequestException(message);

    // add exercises to training component
    const trainingExercises = await this.trainingExerciseService.createMany(ref, [input]);
    component.exercises = [...component.exercises || [], ...trainingExercises];

    return component;
  }

  async updateExercise(
    user: User,
    ref: Required<TrainingExerciseRef>,
    input: Partial<TrainingExercise>,
  ): Promise<TrainingExercise> {
    this.logger.debug(`Updating exercise in training (user ${user.uid}): ${JSON.stringify(input)}`);

    // find parent references (group, cycle, training, component, exercise)
    const trainingExercise = await this.findUserTrainingExercise(user, ref);

    // validate data
    const exercise = await this.exerciseService.findOneByIdOrFail(user, trainingExercise.exerciseId);
    const { error, message } = await this.exerciseService.validate(ref.componentId, [exercise]);
    if (error) throw new BadRequestException(message);

    // update training exercise and its user data
    return await this.trainingExerciseService.update(ref, input);
  }

  private filter(query: Query, filter?: Filter<Training>) {
    if (!filter) return query;

    if (filter.ids) query = query.where('id', 'in', filter.ids);
    if (filter.subgroupId) query = query.where('subgroupId', filter.subgroupId.op || '==', filter.subgroupId.value);
    if (filter.from) query = query.where('from', filter.from.op || '>=', Timestamp.fromDate(filter.from.value));
    if (filter.to) query = query.where('to', filter.to.op || '<=', Timestamp.fromDate(filter.to.value));

    return query;
  }

  private paginate(query: Query, paginate?: PaginateOptions<Training>) {
    if (!paginate) return query;

    const { orderBy, page, pageSize, limit } = paginate;
    if (orderBy) query = query.orderBy(orderBy.field, orderBy.value);
    if (limit) query = query.limit(limit);
    if (page && pageSize) query = query.offset((page - 1) * pageSize).limit(pageSize);

    return query;
  }

  private async populate(ref: Required<TrainingRef>, training: Training, options?: FindOneOptions<Training>) {
    const { populate = [] } = options || {};

    if (populate.includes('components')) {
      training.components = await this.trainingComponentRepository.getDocs(ref);

      if (populate.includes('components.component'))
        await Promise.all(training.components.map(async (component) => {
          component.component = await this.componentService.findOneByIdOrFail(component.componentId);
        }));

      if (populate.includes('components.exercises'))
        await Promise.all(training.components.map(async (component) => {
          const componentRef = { ...ref, componentId: component.componentId };
          component.exercises = await this.trainingExerciseRepository.getDocs(componentRef);
        }));

      if (populate.includes('components.exercises.data'))
        // TODO
        throw new Error('Not implemented yet');
    }

    if (populate.includes('subgroup') && training.subgroupId) {
      training.subgroup = await this.subgroupRepository.getDoc({ ...ref, subgroupId: training.subgroupId });
    }
  }

  private async validate(user: User, group: Group, cycle: Cycle, data: Partial<Training>): Promise<Validate> {
    // check that user is owner of the group
    if (!this.groupService.isOwner(user, group))
      return { error: true, message: 'You are not authorized to create training for this cycle' };

    // check that subgroup exists within cycle's parent group
    const subgroup = group.subgroups.find(subgroup => subgroup.id === data.subgroupId) || null;
    if (data.subgroupId && !subgroup)
      return { error: true, message: 'Invalid subgroup provided' };

    // check time
    if (this.commonService.date.isBetween(data.from, cycle.from, cycle.to))
      return { error: true, message: 'Training must be within cycle start and end date' };

    return { error: false };
  }
}
