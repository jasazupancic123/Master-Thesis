import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  addMinutes,
  endOfDay,
  isBefore,
  startOfDay,
  startOfHour,
  subMinutes,
} from 'date-fns';
import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { CommonService } from '../../common/service/common.service';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { User } from '../../common/type/firebase-auth.type';
import {
  ComponentRef,
  CycleRef,
  GroupRef,
  TrainingComponentRef,
  TrainingRef,
  UserRef,
  WorkloadRef,
} from '../../common/type/firestore.type';
import { Filter } from '../../common/type/orm.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { Cycle } from '../../group/entity/cycle.entity';
import { Group } from '../../group/entity/group.entity';
import { GroupService } from '../../group/group.service';
import { UserService } from '../../user/user.service';
import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';
import { TrainingRepository } from '../repository/training.repository';
import { TrainingPlanService } from './training-plan.service';
import { WorkloadService } from './workload.service';
import { Workload } from '../entity/workload.entity';
import { CreateWorkload } from '../dto/create-workload.dto';
import dayjs from 'dayjs';
import { SetStatus } from '../enum/set-status.enum';
import { ParamType } from '../../component/enum/param.enum';
import { FinishComponentDto } from '../dto/finish-component.dto';
import { CreateTrainingDto } from '../dto/create-training.dto';
import { BatchUpdateTrainingsDto } from '../dto/update-training.dto';
import { GroupWorkloadStats } from '../entity/average-workload-values.entity';
import { FindAthleteGroupWorkloads } from '../dto/find-workload.dto';
import { CopyTrainingDto } from '../dto/copy-training.dto';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadService: WorkloadService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return query(this.trainingRepository.collection()).get();
  }

  async getDocsByGroup(groupId: string): Promise<Training[]> {
    return this.trainingRepository
      .collection()
      .where('groupId', '==', groupId)
      .orderBy('from', 'asc')
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<Training>,
          ),
        ),
      );
  }

  async findOne(user: User, ref: TrainingRef): Promise<Training | null> {
    // find training
    const training = await this.trainingRepository.getDoc(ref.trainingId);
    if (!training || training.deletedAt) return null;

    // authorize user
    if (!this.isAuthorized(user, training))
      throw new UnauthorizedException(
        'You are not authorized to view this training',
      );

    return training;
  }

  async findOneOrFail(user: User, ref: TrainingRef): Promise<Training> {
    const training = await this.findOne(user, ref);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findAll(user: User, filter?: Filter<Training>): Promise<Training[]> {
    const dbUser = await this.userService.findOne(user.uid);

    const from = filter?.from ? filter.from : undefined;
    const to = filter?.to ? filter.to : undefined;

    let trainings = await this.trainingRepository.getDocs((q) => {
      // filter by date
      // TODO - does not work yet
      // if (from && to) q.where('from', '>=', from).where('from', '<', to);

      // filter by roles
      if (
        this.firebaseService.isTrainer(user) ||
        this.firebaseService.isManager(user)
      )
        q = q.where('ownerId', '==', user.uid);
      else if (this.firebaseService.isAthlete(user)) {
        if (dbUser?.groupsIds?.length === 0) return q;
        else
          q = q
            .where('groupId', 'in', dbUser.groupsIds)
            .where('membersIds', 'array-contains', user.uid);
      }

      // filter by other params
      if (filter?.groupId) q = q.where('groupId', '==', filter.groupId);
      if (filter?.cycleId) q = q.where('cycleId', '==', filter.cycleId);

      q = q.orderBy('from', 'asc');
      return q;
    });

    if (from && to)
      trainings = trainings.filter((t) =>
        this.commonService.date.isBetween(t.from, from, to),
      );

    return trainings;
  }

  async findByIdAndPopulateAthleteWorkloads(
    user: User,
    ref: TrainingRef & ComponentRef,
  ): Promise<Training> {
    const { trainingId, componentId } = ref;
    this.logger.log(`User ${user.uid} is getting training ${trainingId}`);

    const training = await this.findOneOrFail(user, { trainingId });

    const component = [
      training.warmup,
      ...training.components,
      training.cooldown,
    ].find((c) => c.id === componentId);

    if (!component)
      throw new BadRequestException('Component not found in training');

    const workloads =
      await this.workloadService.findAllByUserTrainingComponentId(
        user.uid,
        trainingId,
        componentId,
      );

    for (const superset of component.supersets) {
      for (const exercise of superset.exercises) {
        for (const set of exercise.sets) {
          const workload = workloads.find(
            (w) =>
              w.exerciseId === exercise.id && w.setNumber === set.setNumber,
          );

          if (!workload) continue;

          for (const paramValue of set.paramValuesL) {
            const value = this.getPrescribedValueByParamField(
              paramValue.field,
              workload,
              'L',
            );

            if (!value) continue;
            paramValue.value = value;
          }

          for (const paramValue of set.paramValuesR) {
            const value = this.getPrescribedValueByParamField(
              paramValue.field,
              workload,
              'R',
            );

            if (!value) continue;
            paramValue.value = value;
          }
        }
      }
    }

    return training;
  }

  private getPrescribedValueByParamField(
    field: string,
    workload: Workload,
    leftOrRight: 'L' | 'R',
  ) {
    switch (field) {
      case ParamType.VolWorkSets:
        // cannot set different number of sets for athlete
        return null;
      case ParamType.VolRec1:
        return leftOrRight === 'L'
          ? workload.prescribedVolRecValueL.toString()
          : workload.prescribedVolRecValueR.toString();
      case ParamType.VolWork1:
        return leftOrRight === 'L'
          ? workload.prescribedVolWork1ValueL.toString()
          : workload.prescribedVolWork1ValueR.toString();
      case ParamType.VolWork2:
        return leftOrRight === 'L'
          ? workload.prescribedVolWork2ValueL.toString()
          : workload.prescribedVolWork2ValueR.toString();
      case ParamType.IntRec1:
        return leftOrRight === 'L'
          ? workload.prescribedIntRecValueL.toString()
          : workload.prescribedIntRecValueR.toString();
      case ParamType.IntWork1:
        return leftOrRight === 'L'
          ? workload.prescribedIntWork1ValueL.toString()
          : workload.prescribedIntWork1ValueR.toString();
      case ParamType.IntWork2:
        return leftOrRight === 'L'
          ? workload.prescribedIntWork2ValueL.toString()
          : workload.prescribedIntWork2ValueR.toString();
      default:
        return null;
    }
  }

  async findAthleteGroupWorkloads(
    user: User,
    ref: GroupRef & UserRef,
    input: FindAthleteGroupWorkloads,
  ): Promise<{ completedWorkloads: Workload[]; futureWorkloads: Workload[] }> {
    this.logger.log(
      `User ${user.uid} is getting workloads for athlete ${ref.uid}`,
    );

    const workloads = await this.workloadService.findAllByRef({
      userId: ref.uid,
      groupId: ref.groupId,
      exerciseIds: input.exerciseIds,
    });

    const completedWorkloads = workloads.filter(
      (w) => w.status !== SetStatus.NOT_STARTED,
    );

    const futureWorkloads = workloads.filter(
      (w) => w.status === SetStatus.NOT_STARTED,
    );

    return { completedWorkloads, futureWorkloads };
  }

  private getFromAndToDates(components: TrainingComponent[]): {
    from: Date;
    to: Date;
  } {
    let from: Date;
    let to: Date;

    if (components.length === 0)
      throw new BadRequestException('Training must have atleast one component');

    if (components.length === 1) {
      from = components[0].from;
      to = components[0].to;
    }

    if (components.length > 1) {
      from = components[0].from;
      to = components[components.length - 1].to;
    }

    return { from, to };
  }

  async create(user: User, input: CreateTrainingDto): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
    );

    // const { training: propsTraining, copyFromTrainingId, date } = input;
    const { groupId, cycleId } = input;

    // validate parent references
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);
    const { from, to } = this.getFromAndToDates(input.components);

    this.validateOwner(user.uid, group);
    this.checkTrainingIsInCycle(from, cycle);
    this.validateIsTrainingInFuture(from);
    await this.validateOverlap(from, to, group.id, cycle.id);

    // warmup and cooldown components
    const { warmup, cooldown } =
      this.trainingPlanService.createWarmupAndCooldown(
        from,
        to,
        input.components,
      );

    // validate components & exercises
    const attributes = await this.cacheManagerService.getAttributes();
    const components = await this.cacheManagerService.getComponents();
    const exercises = await this.trainingPlanService.findAllTrainingExercises(
      user,
      input.components,
    );

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      group.membersIds,
      [warmup, ...input.components, cooldown],
      components,
    );

    // populate exercise params from components
    this.trainingPlanService.populateTrainingExerciseParams(
      input.components,
      components,
      exercises,
      attributes,
    );

    // create training
    const wellness = await this.userService.getRecentWellness(group.membersIds);
    const workloads = await this.workloadService.findAllByRef({
      memberIds: group.membersIds,
    });

    const data: Create<Training> = {
      id: null,
      groupId: group.id,
      cycleId: input.cycleId,
      ownerId: user.uid,
      copiedFromId: null,
      from,
      to,
      membersIds: group.membersIds,
      wellness,
      completedMembersIds: [],
      stats: input.stats || [],
      futureStats: input.futureStats || [],
      warmup,
      cooldown,
      components: input.components.map((c) => ({
        id: c.id,
        from: c.from,
        to: c.to,
        color: c.color,
        subgroups: c.subgroups || [],
        supersets: c.supersets || [],
        completedMembersIds: [],
      })),
    };

    const trainingDocRef = this.trainingRepository.collection().doc();
    const training: Training = {
      ...data,
      id: trainingDocRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createTrainingQuery = this.firebaseService.buildCreateQuery<Training>(
      { ...data, id: training.id },
      { timestamps: true },
    );

    // create training, add trainer to users, create workloads
    const batch = this.firebaseService.firestore.batch();
    batch.set(trainingDocRef, createTrainingQuery);

    for (const userId of group.membersIds) {
      const docRef = this.userService.getDoc(userId);
      batch.update(docRef, {
        trainersIds: FieldValue.arrayUnion(user.uid),
      });
    }

    this.workloadService.createForTraining(batch, training, workloads);
    await batch.commit();

    return training;
  }

  async update(
    user: User,
    ref: TrainingRef,
    input: Update<Training>,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // validate training
    const training = await this.findOneOrFail(user, ref);
    const { groupId, cycleId } = training;

    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);
    this.validateOwner(user.uid, training);

    // if no components, delete training
    if (input.components.length === 0) {
      await this.trainingRepository.deleteDoc(ref.trainingId);
      return {
        ...training,
        ...this.commonService.object.clean(input),
      };
    }

    const { from, to } = this.getFromAndToDates(input.components);
    this.checkTrainingIsInCycle(from, cycle);
    this.validateIsTrainingInFuture(from);
    await this.validateOverlap(from, to, groupId, cycleId, training.id);

    // validate components & exercises
    const attributes = await this.cacheManagerService.getAttributes();
    const components = await this.cacheManagerService.getComponents();
    const membersIds = input.membersIds || training.membersIds;
    await this.validateTrainingMembers(membersIds);

    const exercises = await this.trainingPlanService.findAllTrainingExercises(
      user,
      input.components,
    );

    this.trainingPlanService.updateWarmupAndCooldownTimes(
      input.warmup,
      input.cooldown,
      input.components,
    );

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      membersIds,
      [input.warmup, ...input.components, input.cooldown],
      components,
    );

    // populate exercise params from components
    this.trainingPlanService.populateTrainingExerciseParams(
      input.components,
      components,
      exercises,
      attributes,
    );

    // for future trainings, update latest meta and calculate workloads
    const wellness = await this.userService.getRecentWellness(membersIds);
    const workloads = await this.workloadService.findAllByMembers(membersIds);

    const updated = {
      ...training,
      ...this.commonService.object.clean(input),
    };

    const trainingDocRef = this.trainingRepository.doc(ref.trainingId);
    const updateTrainingQuery = this.firebaseService.buildUpdateQuery<Training>(
      { ...input, wellness },
    );

    const batch = this.firebaseService.firestore.batch();
    batch.update(trainingDocRef, updateTrainingQuery);
    this.workloadService.createForTraining(batch, updated, workloads);
    await batch.commit();

    return updated;
  }

  async batchUpdate(
    user: User,
    ref: CycleRef,
    body: BatchUpdateTrainingsDto,
  ): Promise<Training[]> {
    const { trainings: input, customAthleteWorkloads } = body;
    this.logger.log(
      `User ${user.uid} is updating ${input.length} trainings: ${JSON.stringify(input)}`,
    );

    const { groupId, cycleId } = ref;
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);
    this.validateOwner(user.uid, group);

    const updated = [];
    for (const data of input) {
      // validate training
      const training = await this.findOneOrFail(user, { trainingId: data.id });

      const { from, to } = this.getFromAndToDates(data.components);
      this.checkTrainingIsInCycle(from, cycle);
      this.validateIsTrainingInFuture(from);
      await this.validateOverlap(from, to, groupId, cycleId, training.id);

      // validate components & exercises
      const attributes = await this.cacheManagerService.getAttributes();
      const components = await this.cacheManagerService.getComponents();
      const membersIds = data.membersIds || training.membersIds;
      await this.validateTrainingMembers(membersIds);

      const exercises = await this.trainingPlanService.findAllTrainingExercises(
        user,
        data.components,
      );

      this.trainingPlanService.updateWarmupAndCooldownTimes(
        data.warmup,
        data.cooldown,
        data.components,
      );

      this.trainingPlanService.validateTrainingComponents(
        exercises,
        membersIds,
        [data.warmup, ...data.components, data.cooldown],
        components,
      );

      // populate exercise params from components
      this.trainingPlanService.populateTrainingExerciseParams(
        data.components,
        components,
        exercises,
        attributes,
      );

      // for future trainings, update latest meta and calculate workloads
      const wellness = await this.userService.getRecentWellness(membersIds);
      const workloads = await this.workloadService.findAllByMembers(membersIds);

      const updatedTraining = {
        ...training,
        ...this.commonService.object.clean(data),
      };

      updated.push(updatedTraining);

      const trainingDocRef = this.trainingRepository.doc(data.id);
      const updateTrainingQuery =
        this.firebaseService.buildUpdateQuery<Training>({
          ...data,
          wellness,
        });

      const batch = this.firebaseService.firestore.batch();
      batch.update(trainingDocRef, updateTrainingQuery);

      const filteredWorkloads = workloads.filter(
        (w) =>
          !customAthleteWorkloads.some(
            (cw) =>
              cw.trainingId === w.trainingId &&
              cw.userId === w.userId &&
              cw.exerciseId === w.exerciseId &&
              cw.setNumber === w.setNumber &&
              cw.componentId === w.componentId,
          ),
      );

      await this.workloadService.createForTraining(
        batch,
        updatedTraining,
        filteredWorkloads,
      );

      this.workloadService.createForCustomAthleteWorkloads(
        batch,
        customAthleteWorkloads,
      );

      await batch.commit();
    }

    return updated;
  }

  async copy(
    user: User,
    ref: TrainingRef,
    input: CopyTrainingDto,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is copying training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    const training = await this.findOneOrFail(user, ref);
    const { groupId, cycleId } = training;
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);

    const membersIds = input.training.membersIds || training.membersIds;

    const wellness = await this.userService.getRecentWellness(membersIds);
    const trainingTo = addMinutes(
      startOfHour(input.from),
      training.components.length * 30,
    );

    // create by copying a component from another training section
    /* let copyFromTraining: Training,
      trainingComponent: TrainingComponent,
      avgCompletedWorkloadValues: GroupWorkloadStats[],
      avgFutureWorkloadValues: GroupWorkloadStats[];

    if (copyFromTrainingId) {
      copyFromTraining = await this.findOneOrFail(user, {
        trainingId: copyFromTrainingId,
      });

      // frontend needs to pass only the copied component
      trainingComponent = propsTraining.components[0];
      if (propsTraining.components.length !== 1)
        throw new BadRequestException(
          'You can only copy a training with one component',
        );

      // keep avg workload values for exercises of only the copied component
      const exerciseIdsToKeep = trainingComponent.supersets
        .map((superset) => superset.exercises.map((e) => e.id))
        .flat();

      avgCompletedWorkloadValues = copyFromTraining.stats.filter((w) =>
        exerciseIdsToKeep.includes(w.exerciseId),
      );

      avgFutureWorkloadValues = copyFromTraining.futureStats.filter((w) =>
        exerciseIdsToKeep.includes(w.exerciseId),
      );
    } */

    const data: Create<Training> = {
      id: null,
      groupId: training.groupId,
      cycleId: training.cycleId,
      ownerId: user.uid,
      copiedFromId: training.id,
      from: input.date?.from,
      to: trainingTo,
      membersIds: training.membersIds,
      wellness,
      completedMembersIds: [],
      stats: training.stats || [],
      futureStats: training.futureStats || [],
      components: training.components.map((c, i) => {
        const from = addMinutes(startOfHour(input.from), i * 30);
        const to = addMinutes(from, 30);

        return {
          id: c.id,
          from: from,
          to: to,
          color: c.color,
          subgroups: c.subgroups || [],
          supersets: c.supersets || [],
          completedMembersIds: [],
        };
      }),
      warmup: {
        ...training.warmup,
        from: subMinutes(input.from, 5),
        to: input.training.from,
      },
      cooldown: {
        ...training.cooldown,
        from: trainingTo,
        to: addMinutes(trainingTo, 5),
      },
    };

    const trainingDocRef = this.trainingRepository.collection().doc();
    const copiedTraining: Training = {
      ...data,
      id: trainingDocRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // for future trainings, update latest meta and calculate workloads
    this.checkTrainingIsInCycle(input.from, cycle);
    this.validateIsTrainingInFuture(input.from);
    await this.validateOverlap(
      copiedTraining.from,
      copiedTraining.components[copiedTraining.components.length - 1].from,
      groupId,
      cycleId,
    );

    // validate components & exercises in case user cannot view exercises of another user
    const components = await this.cacheManagerService.getComponents();
    const exercises = await this.trainingPlanService.findAllTrainingExercises(
      user,
      copiedTraining.components,
    );

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      membersIds,
      [
        copiedTraining.warmup,
        ...copiedTraining.components,
        copiedTraining.cooldown,
      ],
      components,
    );

    const copyTrainingQuery = this.firebaseService.buildCreateQuery<Training>(
      { ...data, id: copiedTraining.id },
      { timestamps: true },
    );

    const workloads = await this.workloadService.findAllByMembers(membersIds);

    // create training, add trainer to users, create workloads
    const batch = this.firebaseService.firestore.batch();
    batch.set(trainingDocRef, copyTrainingQuery);

    for (const userId of group.membersIds) {
      const docRef = this.userService.getDoc(userId);
      batch.update(docRef, {
        trainersIds: FieldValue.arrayUnion(user.uid),
      });
    }

    this.workloadService.createForTraining(batch, copiedTraining, workloads);
    await batch.commit();

    return copiedTraining;
  }

  async remove(user: User, ref: TrainingRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing training ${ref.trainingId}`);

    const training = await this.findOneOrFail(user, ref);
    this.validateOwner(user.uid, training);
    this.validateIsTrainingInFuture(training.from);

    await this.trainingRepository.deleteDoc(ref.trainingId);
  }

  async finishComponent(
    user: User,
    ref: TrainingRef & ComponentRef,
    input: FinishComponentDto,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is finishing component ${ref.componentId} for training ${ref.trainingId}`,
    );

    // find refs
    const { trainingId, componentId } = ref;
    const training = await this.findOneOrFail(user, ref);
    const workloads = await this.workloadService.findAllByRef({
      userId: user.uid,
      trainingId,
      componentId,
    });

    // validation
    const exercises = input.supersets.flatMap((s) => s.exercises); // completed exercises
    const allComponents =
      this.trainingPlanService.getTrainingComponents(training);

    // mark user as completed (for component and training)
    const component = allComponents.find((c) => c.id === componentId);
    if (!component) throw new BadRequestException('Component not found');

    component.completedMembersIds.push(user.uid);
    if (this.trainingPlanService.isTrainingCompleted(user.uid, allComponents))
      training.completedMembersIds.push(user.uid);

    // update stats
    const stats = this.trainingPlanService.calculateTrainingStats(
      training,
      exercises,
      input.rootComponentId,
    );

    // update workloads
    const batch = this.firebaseService.firestore.batch();
    for (const w of workloads) {
      const exercise = exercises.find((e) => e.id === w.exerciseId);
      const set = exercise.sets.find((s) => s.setNumber === w.setNumber);

      const paramValuesL = this.workloadService.parseActualParamValues(
        set.paramValuesL,
      );

      const paramValuesR = this.workloadService.parseActualParamValues(
        set.paramValuesR,
      );

      const query = this.firebaseService.buildUpdateQuery<Workload>({
        status: SetStatus.COMPLETED,
        volWork1ValueL: paramValuesL.volWork1Value,
        volWork1ValueR: paramValuesR.volWork1Value,
        volWork2ValueL: paramValuesL.volWork2Value,
        volWork2ValueR: paramValuesR.volWork2Value,
        volRecValueL: paramValuesL.volRecValue,
        volRecValueR: paramValuesR.volRecValue,
        intWork1ValueL: paramValuesL.intWork1Value,
        intWork1ValueR: paramValuesR.intWork1Value,
        intWork2ValueL: paramValuesL.intWork2Value,
        intWork2ValueR: paramValuesR.intWork2Value,
        intRecValueL: paramValuesL.intRecValue,
        intRecValueR: paramValuesR.intRecValue,
      });

      const docRef = this.workloadService.getDoc(w);
      batch.update(docRef, query);
    }

    const docRef = this.trainingRepository.doc(trainingId);
    const updateTrainingQuery = this.firebaseService.buildUpdateQuery<Training>(
      {
        components: training.components,
        completedMembersIds: training.completedMembersIds,
        stats: [...(training.stats || []), stats],
      },
    );

    batch.update(docRef, updateTrainingQuery);
    await batch.commit();

    return training;
  }

  async addComponents(
    user: User,
    ref: TrainingRef,
    input: TrainingComponent[],
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is adding component to training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateOwner(user.uid, training);
    this.validateIsTrainingInFuture(training.from);

    // validate components & exercises
    const components = await this.cacheManagerService.getComponents();
    const trainingComponents = [...training.components, ...input];
    const exercises = await this.trainingPlanService.findAllTrainingExercises(
      user,
      trainingComponents,
    );

    this.trainingPlanService.updateWarmupAndCooldownTimes(
      training.warmup,
      training.cooldown,
      trainingComponents,
    );

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      training.membersIds,
      [training.warmup, ...trainingComponents, training.cooldown],
      components,
    );

    // get query for training
    const [query, updatedTraining] =
      this.trainingPlanService.getAddComponentsQuery(training, input);

    // add components
    await this.trainingRepository.updateDoc(training.id, query);

    return updatedTraining;
  }

  async deleteComponent(
    ref: TrainingComponentRef,
    user: User,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is deleting component ${ref.componentId} from training ${ref.trainingId}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateOwner(user.uid, training);
    this.validateIsTrainingInFuture(training.from);

    const filtered = training.components.filter(
      (c) => c.id !== ref.componentId,
    );
    if (filtered.length > 0)
      this.trainingPlanService.updateWarmupAndCooldownTimes(
        training.warmup,
        training.cooldown,
        filtered,
      );

    // get query for training
    const [query, updatedTraining] =
      this.trainingPlanService.getDeleteComponentQuery(training, ref);

    // delete component
    if (query.components.length === 0) {
      // delete doc
      this.logger.log('No components left, deleting training');
      await this.trainingRepository.deleteDoc(ref.trainingId);
    } else await this.trainingRepository.updateDoc(ref.trainingId, query);

    return updatedTraining;
  }

  private async validateOverlap(
    from: Date,
    to: Date,
    groupId: string,
    cycleId: string,
    trainingId?: string,
  ) {
    const trainings = (
      await this.trainingRepository.getDocs((q) =>
        q
          .where('groupId', '==', groupId)
          .where('cycleId', '==', cycleId)
          .where('from', '>=', Timestamp.fromDate(startOfDay(from)))
          .where('from', '<', Timestamp.fromDate(endOfDay(from))),
      )
    ).filter((t) => t.id !== trainingId);

    if (trainings.length > 1)
      throw new BadRequestException(
        'Maximum number of trainings per day reached',
      );

    const isOverlap = trainings.some((training) =>
      this.commonService.date.doRangesOverlap(
        from,
        to,
        training.from,
        training.to,
      ),
    );

    if (isOverlap)
      throw new BadRequestException('Training overlaps with other training');
  }

  private async validateTrainingMembers(membersIds: string[]) {
    const users = await this.firebaseService.authUsers({ ids: membersIds });
    if (users.length !== membersIds.length)
      throw new BadRequestException('Some members do not exist');
  }

  private isAuthorized(user: User, training: Training): boolean {
    return (
      training.ownerId === user.uid || training.membersIds.includes(user.uid)
    );
  }

  private checkTrainingIsInCycle(from: Date, cycle: Cycle) {
    if (!this.commonService.date.isBetween(from, cycle.from, cycle.to))
      throw new BadRequestException(
        'Training falls outside of the selected cycle',
      );
  }

  private validateOwner(userId: string, groupOrTraining: Group | Training) {
    if (!this.groupService.isOwner(userId, groupOrTraining))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private isInPast(date: Date, relativeDate = new Date()) {
    return isBefore(date, relativeDate);
  }

  private validateIsTrainingInFuture(from: Date, relativeDate = new Date()) {
    if (this.isInPast(from, relativeDate))
      throw new BadRequestException(
        'You cannot add or update trainings in the past',
      );
  }
}
