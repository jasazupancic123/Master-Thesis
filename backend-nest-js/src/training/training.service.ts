import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { User } from '../common/type/custom-claims.type';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { Training } from './entity/training.entity';
import { ComponentService } from '../component/component.service';
import { ExerciseService } from '../exercise/exercise.service';
import { CommonService } from '../common/service/common.service';
import { Filter, Options } from '../common/type/orm.type';
import { Cycle } from '../group/entity/cycle.entity';
import { Validate } from '../common/type/validate.type';
import { CopyTrainingDto } from './dto/copy-training.dto';
import { Group } from '../group/entity/group.entity';
import { CycleParentRef, GroupService } from '../group/group.service';
import { FirestoreCollection } from '../common/enum/firestore-collection.enum';
import { FirebaseService } from '../firebase/firebase.service';
import { TrainingComponent } from './entity/training-component.entity';
import { TrainingExercise } from './entity/training-exercise.entity';
import { SetType } from '../exercise-info/enum/set-type.enum';
import { WorkloadType } from '../exercise-info/enum/workload-type.enum';
import { TrainingExerciseMeta } from './entity/training-exercise-meta.entity';
import { TrainingExerciseUserData } from './entity/training-exercise-user-data.entity';

// group/{groupId}/cycle/{cycleId}/training
export type TrainingParentRef = CycleParentRef & {
  cycleId: string;
}

// group/{groupId}/cycle/{cycleId}/training/{trainingId}/components/{componentId}/exercises/{exerciseId}
export type TrainingExerciseParentRef = TrainingParentRef & {
  trainingId: string;
  componentId: string;
}

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly componentService: ComponentService,
    private readonly exerciseService: ExerciseService,
    private readonly groupService: GroupService,
  ) {
  }

  async findOneById(user: User, parent: TrainingParentRef, id: string): Promise<Training | null> {
    const group = await this.groupService.findOneByIdOrFail(user, parent.groupId);
    const cycle = await this.groupService.findOneCycleByIdOrFail(user, { groupId: group.id }, parent.cycleId);

    const item = await this.trainings({ groupId: group.id, cycleId: cycle.id }).doc(id).get();
    const training = this.firebaseService.serializeDocument<Training>(item);
    return training || null;
  }

  async findOneByIdOrFail(user: User, parent: TrainingParentRef, id: string): Promise<Training> {
    const training = await this.findOneById(user, parent, id);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findAll(user: User, parent: TrainingParentRef, options?: Options<Training>): Promise<Training[]> {
    const { filter } = options || {};
    const { subgroupId } = filter || {};

    // find all trainings for the cycle
    let query = this.trainings(parent) as Query;
    if (subgroupId) {
      if ('$in' in subgroupId) query = query.where('subgroupId', 'in', subgroupId.$in);
      else query = query.where('subgroupId', '==', subgroupId);
    } else query = query.where('subgroupId', '==', null);

    if (filter.from) query = query.where('from', '>=', Timestamp.fromDate(<Date>filter.from));
    if (filter.to) query = query.where('to', '<=', Timestamp.fromDate(<Date>filter.to));

    // get trainings
    const data = await query.orderBy('from').get();
    return this.firebaseService.serialize<Training>(data);
  }

  async findAllByAthlete(user: User, parent: TrainingParentRef, filter: Filter<Training>): Promise<Training[]> {
    // get athlete's current active cycle
    const group = await this.groupService.findOneByIdOrFail(user, parent.groupId);
    const cycle = await this.groupService.findActiveCycle(user, parent, new Date());
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
    const parentTrainings = await this.findAll(user, parent);

    // find all active cycle trainings where subgroupId is null or user is part of the subgroup
    // and filter by date range
    const subgroupsTrainings = await this.findAll(user, parent, { filter: { subgroupId: { $in: subgroups.map(s => s.id) } } });
    const trainings = subgroupsTrainings
      .concat(parentTrainings)
      .sort((a, b) => a.from.getTime() - b.from.getTime());

    return trainings.filter((training) => {
      if (training.subgroupId) return true;
      return range.some(([from, to]) =>
        this.commonService.date.isBetween(training.from, from, to));
    });
  }

  async create(user: User, data: Partial<Training> & TrainingParentRef & {
    componentIds: string[]
  }): Promise<Training> {
    this.logger.debug(`Creating training (user ${user.uid}): ${JSON.stringify(data)}`);

    // find parent references (group and cycle)
    const { groupId, cycleId } = data;
    const group = await this.groupService.findOneByIdOrFail(user, groupId);
    const cycle = await this.groupService.findOneCycleByIdOrFail(user, { groupId }, cycleId);

    // validate data
    const { error, message } = await this.validate(user, group, cycle, data);
    if (error) throw new BadRequestException(message);

    // create training
    const parent = { groupId, cycleId };
    const item = await this.trainings(parent).add({
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

      await this.components(parent, training.id).doc(trainingComponent.componentId).set({ ...trainingComponent });

      trainingComponent.exercises = [];
      training.components = [...training.components || [], trainingComponent as TrainingComponent];
    }
  }

  async addExercise(
    user: User,
    parent: TrainingExerciseParentRef,
    data: Partial<TrainingExercise> & { exercisesIds: string[] },
  ) {
    this.logger.debug(`Adding exercise to training (user ${user.uid}): ${JSON.stringify(data)}`);

    // find parent references (group, cycle, training, component)
    const { groupId, cycleId, trainingId, componentId } = parent;
    const group = await this.groupService.findOneByIdOrFail(user, groupId);
    const cycle = await this.groupService.findOneCycleByIdOrFail(user, { groupId }, cycleId);
    const training = await this.findOneByIdOrFail(user, { groupId, cycleId }, trainingId);
    const component = await this.componentService.findOneByIdOrFail(componentId);

    // find exercises
    const exercises = await this.exerciseService.findAll(user, { filter: { ids: data.exercisesIds } });
    if (exercises.length < 1 || exercises.length !== data.exercisesIds.length)
      throw new BadRequestException('Invalid exercises provided in the request');

    // validate data
    const { error, message } = await this.exerciseService.validate(user, componentId, exercises);
    if (error) throw new BadRequestException(message);

    // add exercises to component
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      const trainingExercise: TrainingExercise = {
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
        data: [],
      };

      await this.exercises(parent).doc(trainingExercise.exerciseId).set({ ...trainingExercise });
    }


  }

  async copy(user: User, data: CopyTrainingDto): Promise<Training> {
    this.logger.debug(`Copying training (user ${user.uid}): ${JSON.stringify(data)}`);

    /*const found = await this.repository.findOneByIdOrFail(data.trainingId);
    const training: Partial<Training> = {
      id: data.trainingId,
      cycleId: data.cycleId || data.cycleId,
      subgroupId: data.subgroupId || found.subgroupId || null,
      from: found.from,
      to: found.to,
    };

    const { error, message, data: { cycle, subgroup } } = await this.validate(user, training);
    if (error) throw new BadRequestException(message);

    // copy training
    const newTraining = await this.repository.create({
      cycleId: cycle.id,
      subgroupId: subgroup?.id || null,
      from: training.from,
      to: training.to,
    });

    // copy sets
    const setGroups = await this.setService.copyTraining(user, found, newTraining.id);
    return { ...newTraining, components: setGroups };*/

    return {} as Training;
  }

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

    return { error: false, data: { cycle, subgroup } };
  }

  private async createTrainingExerciseData(
    user: User,
    parent: TrainingExerciseParentRef,
    exerciseId: string,
    members: User[],
    data: Partial<TrainingExerciseMeta>,
  ) {
    const exercise = await this.exerciseService.findOneByIdOrFail(user, exerciseId);

    // for each member, calculate individual values for exercise data
    const input: Partial<TrainingExerciseUserData>[] = await Promise.all(members.map(async (member) => ({
      userId: member.uid,
      completedSets: 0,
      workloadValue: await this.calculateValueFromWorkloadType(data.workloadType, data.workloadValue, member, exercise.id),
    })));
  }

  private async calculateUserWorkloadValue(
    type: WorkloadType,
    value: number,
    member: User,
    exerciseId: string,
  ) {
    switch (type) {
      case WorkloadType.RM:
        // fetch 1RM from last month of user exercises, use formula and save value as KG
        const values = await this.getMemberExerciseValues(member, exerciseId);
        return this.commonService.number.rm(values);
      case WorkloadType.BW:
        // fetch body weight from user's profile and save % of it as KG
        const bodyweight = member.customClaims.bodyweight || 0;
        return bodyweight * this.commonService.number.percent(value);
      case WorkloadType.INT:
      case WorkloadType.KG:
      default:
        return value;
    }
  }

  private async getMemberExerciseValues(member: User, exerciseId: string) {
    // fetch all exercises for user from last month
    const data = setExercises.map(({ exerciseInfo, superExerciseInfo }) => {
      switch (superExerciseInfo.setType) {
        case SetType.REPS:
          return {
            reps: superExerciseInfo.setTypeValue,
            weight: exerciseInfo?.[0]?.value || 0,
          };
        default:
          return null;
      }
    });

    // return only non-null values
    return data.filter((item) => item);
  }

  private trainings({ groupId, cycleId }: TrainingParentRef) {
    return this.groupService.cycles(groupId).doc(cycleId).collection(FirestoreCollection.TRAINING);
  }

  private components(parent: TrainingParentRef, trainingId: string) {
    return this.trainings(parent).doc(trainingId).collection(FirestoreCollection.TRAINING_COMPONENT);
  }

  private exercises(parent: TrainingExerciseParentRef) {
    return this.components(parent, parent.trainingId).doc(parent.componentId).collection(FirestoreCollection.TRAINING_EXERCISE);
  }
}
