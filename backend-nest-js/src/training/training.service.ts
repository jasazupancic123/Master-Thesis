import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../common/type/custom-claims.type';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { Training } from './entity/training.entity';
import { ComponentService } from '../component/component.service';
import { ExerciseService } from '../exercise/exercise.service';
import { CommonService } from '../common/service/common.service';
import { FindOneOptions, isFilterOperator, Options } from '../common/type/orm.type';
import { Cycle } from '../group/entity/cycle.entity';
import { Validate } from '../common/type/validate.type';
import { Group } from '../group/entity/group.entity';
import { GroupService } from '../group/group.service';
import { FirestoreCollection } from '../common/enum/firestore-collection.enum';
import { FirebaseService } from '../firebase/firebase.service';
import { TrainingComponent } from './entity/training-component.entity';
import { TrainingExercise } from './entity/training-exercise.entity';
import { SetType } from './enum/set-type.enum';
import { WorkloadType } from './enum/workload-type.enum';
import { Wrapper } from '../common/type/wrapper.type';
import { TrainingExerciseUserDataService } from './service/training-exercise-user-data.service';
import { TrainingRef, TrainingRepository } from './repository/training.repository';
import { TrainingComponentRepository } from './repository/training-component.repository';
import { TrainingExerciseRepository } from './repository/training-exercise.repository';

@Injectable()
export class TrainingService {
  collection = {
    trainings: (ref: TrainingRef) => this.groupService.collection.cycle(ref).collection(FirestoreCollection.TRAINING),
    training: (ref: TrainingRef) => this.collection.trainings(ref).doc(ref.trainingId),
    components: (ref: TrainingRef) => this.collection.training(ref).collection(FirestoreCollection.TRAINING_COMPONENT),
    component: (ref: TrainingRef) => this.collection.components(ref).doc(ref.componentId),
    exercises: (ref: TrainingRef) => this.collection.component(ref).collection(FirestoreCollection.TRAINING_EXERCISE),
    exercise: (ref: TrainingRef) => this.collection.exercises(ref).doc(ref.exerciseId),
    data: (ref: TrainingRef) => this.collection.exercise(ref).collection(FirestoreCollection.TRAINING_EXERCISE_USER_DATA),
    userData: (ref: TrainingRef) => this.collection.data(ref).doc(ref.userId),
  };

  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingComponentRepository: TrainingComponentRepository,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    private readonly trainingExerciseUserDataService: TrainingExerciseUserDataService,
  ) {
  }

  async findTraining(ref: TrainingRef, options?: FindOneOptions<Training>): Promise<Training | null> {
    const { populate } = options || {};
    const training = await this.trainingRepository.getDoc(ref);
  }

  async findTrainingComponents(ref: TrainingRef): Promise<TrainingComponent[]> {
    return await this.trainingComponentRepository.getDocs(ref);
  }

  async findTrainingExercises(ref: TrainingRef): Promise<TrainingExercise[]> {
    return await this.trainingExerciseRepository.getDocs(ref);
  }

  async findOneOrFail(ref: TrainingRef): Promise<Training> {
    const training = await this.findTraining(ref);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findTrainingExercise(ref: TrainingRef): Promise<TrainingExercise> {
    return this.firebaseService.serializeDocument<TrainingExercise>(await this.collection.exercise(ref).get());
  }

  async findTrainingComponent(ref: TrainingRef): Promise<TrainingComponent> {
    return this.firebaseService.serializeDocument<TrainingComponent>(await this.collection.component(ref).get());
  }

  async findTrainings(ref: TrainingRef, options?: Options<Training>): Promise<Training[]> {
    const { filter } = options || {};
    const { subgroupId } = filter || {};

    // find all trainings for the cycle
    let query = this.collection.trainings(ref) as Query;
    if (subgroupId && typeof subgroupId === 'string')
      query.where('subgroupId', '==', subgroupId);
    else if (!subgroupId)
      query.where('subgroupId', '==', null);
    else if (isFilterOperator(subgroupId) && '$in' in subgroupId)
      query = query.where('subgroupId', 'in', subgroupId.$in);

    if (filter.from) query = query.where('from', '>=', Timestamp.fromDate(<Date>filter.from));
    if (filter.to) query = query.where('to', '<=', Timestamp.fromDate(<Date>filter.to));

    // get trainings
    const data = await query.orderBy('from').get();
    return this.firebaseService.serialize<Training>(data);
  }

  async findTrainingsByAthlete(user: User, ref: TrainingRef): Promise<Training[]> {
    // get athlete's current active cycle
    const group = await this.groupService.findOneByIdOrFail(user, ref.groupId);
    const cycle = await this.groupService.findActiveCycle(user, ref, new Date());
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
    const subgroupsTrainings = await this.findTrainings(ref, { filter: { subgroupId: { $in: subgroups.map(s => s.id) } } });
    const trainings = subgroupsTrainings
      .concat(parentTrainings)
      .sort((a, b) => a.from.getTime() - b.from.getTime());

    const athleteTrainings = trainings.filter((training) => {
      if (training.subgroupId) return true;
      return range.some(([from, to]) =>
        this.commonService.date.isBetween(training.from, from, to));
    });

    // populate trainings' components and exercises
    return await Promise.all(athleteTrainings.map(async (training) => {
      const components = await this.collection.components(ref).get();
      training.components = this.firebaseService.serialize<TrainingComponent>(components);

      await Promise.all(training.components.map(async ({ componentId }) => {
        const trainingComponent = training.components.find(c => c.componentId === componentId);
        const exercises = await this.collection.exercises({
          ...ref,
          trainingId: training.id,
          componentId: trainingComponent.componentId,
        }).get();

        trainingComponent.exercises = this.firebaseService.serialize<TrainingExercise>(exercises);
      }));

      return training;
    }));
  }

  async createTraining(user: User, ref: TrainingRef, data: Partial<Training> & {
    componentIds: string[]
  }): Promise<Training> {
    this.logger.debug(`Creating training (user ${user.uid}): ${JSON.stringify(data)}`);

    // find parent references (group and cycle)
    const group = await this.groupService.findOneByIdOrFail(user, ref.groupId);
    const cycle = await this.groupService.findCycleByIdOrFail(user, ref);

    // validate data
    const { error, message } = await this.validate(user, group, cycle, data);
    if (error)
      throw new BadRequestException(message);

    // create training
    const item = await this.collection.trainings(ref).add({
      subgroupId: data.subgroupId || null,
      from: Timestamp.fromDate(data.from),
      to: Timestamp.fromDate(data.to),
    });

    // create training components
    const training = this.firebaseService.serializeDocument<Training>(await item.get());
    const components = await this.componentService.findAllOrFail({ ids: data.componentIds });
    for (let i = 0; i < components.length; i++) {
      const trainingComponent: Partial<TrainingComponent> = {
        componentId: components[i].id,
        order: i,
        color: this.commonService.color.random(),
      };

      const trainingId = training.id;
      const componentId = trainingComponent.componentId;
      await this.collection.component({ ...ref, trainingId, componentId }).set({ ...trainingComponent });

      trainingComponent.exercises = [];
      training.components = [...training.components || [], trainingComponent as TrainingComponent];
    }

    return training;
  }

  async addComponent(user: User, ref: TrainingRef, data: Partial<TrainingComponent>) {
    if (!ref.trainingId) throw new BadRequestException('Training ID is required');
    this.logger.debug(`Adding component to training (user ${user.uid}): ${JSON.stringify(data)}`);

    // find entities
    const training = await this.findOneOrFail(user, ref);
    training.components = await this.findTrainingComponents(ref);
    const component = await this.componentService.findOneByIdOrFail(data.componentId);

    // add component to training
    const input: Partial<TrainingComponent> = {
      componentId: data.componentId,
      order: training.components.length,
      color: this.commonService.color.random(),
    };

    await this.collection.component(ref).set(input);
    training.components = [...training.components || [], input as TrainingComponent];

    return training;
  }

  async addExercise(
    user: User,
    ref: TrainingRef,
    data: Partial<TrainingExercise> & { exercisesIds: string[] },
  ) {
    this.logger.debug(`Adding exercise to training (user ${user.uid}): ${JSON.stringify(data)}`);

    // find parent references (group, cycle, training, component)
    const { groupId, componentId } = ref;
    const group = await this.groupService.findOneByIdOrFail(user, groupId);
    const cycle = await this.groupService.findCycleByIdOrFail(user, ref);
    const training = await this.findOneOrFail(user, ref);

    // find exercises
    const exercises = await this.exerciseService.findAll(user, { filter: { ids: data.exercisesIds } });
    if (exercises.length < 1 || exercises.length !== data.exercisesIds.length)
      throw new BadRequestException('Invalid exercises provided in the request');

    // validate data
    const { error, message } = await this.exerciseService.validate(user, componentId, exercises);
    if (error)
      throw new BadRequestException(message);

    // add exercises to component
    const members = await this.groupService.findMembers(user, group);
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      const trainingExercise: Partial<TrainingExercise> = {
        exerciseId: exercise.id,
        order: i,
        color: this.commonService.color.random(),
        meta: {
          sets: 3,
          setType: SetType.REPS,
          setTypeValue: 10,
          workloadType: WorkloadType.KG,
          workloadValue: 20,
        },
      };

      const exerciseId = trainingExercise.exerciseId;
      await this.collection.exercise({ ...ref, exerciseId }).set({ ...trainingExercise });

      // create exercise data for all users in the group
      trainingExercise.data = await this.createTrainingExerciseData(user, {
        ...ref,
        exerciseId,
      }, members, trainingExercise.meta);
    }
  }

  async updateExercise(
    user: User,
    ref: TrainingRef,
    data: Partial<TrainingExercise>,
  ) {
    this.logger.debug(`Updating exercise in training (user ${user.uid}): ${JSON.stringify(data)}`);

    // find parent references (group, cycle, training, component)
    const { groupId, componentId, exerciseId } = ref;
    const group = await this.groupService.findOneByIdOrFail(user, groupId);
    const cycle = await this.groupService.findCycleByIdOrFail(user, ref);
    const training = await this.findOneOrFail(user, ref);

    // validate data
    const exercise = await this.exerciseService.findOneByIdOrFail(user, exerciseId);
    const { error, message } = await this.exerciseService.validate(user, componentId, [exercise]);
    if (error) throw new BadRequestException(message);

    // update exercise and exercise user data for all users if workload type or value changed
    await this.collection.exercise({ ...ref, exerciseId }).update(data);
    const trainingExercise = this.firebaseService.serializeDocument<TrainingExercise>(await this.collection.exercise({
      ...ref,
      exerciseId,
    }).get());

    const isWorkloadTypeChanged = data.meta && data.meta.workloadType !== trainingExercise.meta.workloadType;
    const isWorkloadValueChanged = data.meta && data.meta.workloadValue !== trainingExercise.meta.workloadValue;
    if (!isWorkloadTypeChanged && !isWorkloadValueChanged)
      return trainingExercise;

    const members = await this.groupService.findMembers(user, group);
    const exerciseData = await this.updateTrainingExerciseData(user, ref, members, data.meta, !isWorkloadTypeChanged);
    return { ...trainingExercise, data: exerciseData };
  }

  async copyTraining(user: User, from: TrainingRef, to: TrainingRef): Promise<Training> {
    this.logger.debug(`Copying training ${from.trainingId} (user ${user.uid})`);

    // copy all training components, exercises, exercise meta and recalculated user data
    const trainingFrom = {
      group: await this.groupService.findOneByIdOrFail(user, from.groupId),
      cycle: await this.groupService.findCycleByIdOrFail(user, from),
      training: await this.findOneOrFail(user, from),
    };

    const trainingTo = {
      group: await this.groupService.findOneByIdOrFail(user, to.groupId),
      cycle: await this.groupService.findCycleByIdOrFail(user, to),
      subgroup: to.subgroupId ? await this.groupService.findSubgroupOrFail(user, to) : null,
    };

    // validate data
    const input: Partial<Training> = {
      subgroupId: trainingTo.subgroup?.id || null,
      from: trainingFrom.training.from,
      to: trainingFrom.training.to,
    };

    const { error, message } = await this.validate(user, trainingTo.group, trainingTo.cycle, input);
    if (error)
      throw new BadRequestException(message);

    // copy training
    const training = await this.collection.trainings(to).add({ ...input });

    // copy training components and exercises
    const trainingComponents = await this.findTrainingComponents(from);
    for (let i = 0; i < trainingComponents.length; i++) {
      const trainingComponent = trainingComponents[i];
      const input: Partial<TrainingComponent> = {
        componentId: trainingComponent.componentId,
        order: i,
        color: trainingComponent.color,
      };

      const trainingId = training.id;
      const componentId = trainingComponent.componentId;
      await this.collection.component({ ...to, trainingId, componentId }).set({ ...input });

      const trainingExercises = this.firebaseService.serialize<TrainingExercise>(await this.collection.exercises({
        ...from,
        trainingId: trainingFrom.training.id,
        componentId: trainingComponent.componentId,
      }).get());

      for (let j = 0; j < trainingExercises.length; j++) {
        const trainingExercise = trainingExercises[j];
        const input: Partial<TrainingExercise> = {
          exerciseId: trainingExercise.id,
          color: trainingExercise.color,
          meta: trainingExercise.meta,
          order: j,
        };

        const exerciseId = input.exerciseId;
        await this.collection.exercise({ ...to, trainingId, componentId, exerciseId }).set({ ...input });

        const members = await this.groupService.findMembers(user, trainingTo.group);
        input.data = await this.createTrainingExerciseData(user, {
          ...to,
          trainingId,
          componentId,
          exerciseId,
        }, members, input.meta);
      }
    }

    return await this.findOneOrFail(user, { ...to, trainingId: training.id });
  }

  private getOptions(options?: FindOneOptions<Training> | Options<Training>): {}

  private async validate(user: User, group: Group, cycle: Cycle, data: Partial<Training>): Promise<Validate> {
    // check that user is owner of cycle
    const isOwner = this.groupService.isOwner(user, group);
    if (!isOwner)
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
