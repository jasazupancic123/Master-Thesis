import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  addDays,
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
import { UserWorkloadService } from './user-workload.service';
import { Workload } from '../entity/workload.entity';
import { CreateWorkload } from '../dto/create-workload.dto';
import dayjs from 'dayjs';
import { SetStatus } from '../enum/set-status.enum';
import { Superset } from '../entity/superset.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { IntType, ParamType, VolType } from 'src/component/enum/param.enum';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { FinishComponentDto } from '../dto/finish-component.dto';
import { AverageWorkloadValues } from '../entity/average-workload-values.entity';
import { CreateTrainingDto } from '../dto/create-training.dto';
import { BatchUpdateTrainingsWithCustomAthleteWorkloadsDto } from '../dto/update-training.dto';
import { custom, StringSchema } from 'joi';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadService: UserWorkloadService,
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
    ref: TrainingRef & UserRef & ComponentRef,
  ): Promise<Training> {
    const { trainingId, uid: athleteId, componentId } = ref;
    this.logger.log(
      `User ${user.uid} is getting training ${trainingId} for athlete ${athleteId}`,
    );

    if (user.uid !== athleteId)
      throw new UnauthorizedException(
        'You are not authorized to view this training',
      );

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
        athleteId,
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
            const value = this.getPerscribedValueByParamField(
              paramValue.field,
              workload,
              'L',
            );
            if (!value) continue;
            paramValue.value = value;
          }
          for (const paramValue of set.paramValuesR) {
            const value = this.getPerscribedValueByParamField(
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

  private getPerscribedValueByParamField(
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

  async getUserWorkloadsByGroupIdAndExerciseIds(
    user: User,
    input: {
      groupId: string;
      body: { exerciseIds: string[]; athleteId?: string };
    },
  ): Promise<{ completedWorkloads: Workload[]; futureWorkloads: Workload[] }> {
    const { groupId, body } = input;
    const { exerciseIds, athleteId } = body;

    this.logger.log(
      `User ${user.uid} is getting workloads for athlete ${athleteId}`,
    );

    const workloads =
      await this.workloadService.findAllByAthleteGroupExerciseIds(
        athleteId,
        groupId,
        exerciseIds,
      );

    const { completedWorkloads, futureWorkloads } =
      this.getCompletedAndFutureWorkloads(workloads);

    return { completedWorkloads, futureWorkloads };
  }

  private getCompletedAndFutureWorkloads(workloads: Workload[]) {
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
    const { training: propsTraining, copyFromTrainingId, date } = input;
    const { groupId, cycleId } = propsTraining;
    this.logger.log(
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
    );

    // validate parent references
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);
    const { from, to } = date
      ? date
      : this.getFromAndToDates(propsTraining.components);

    this.validateOwner(user.uid, group);
    this.checkTrainingIsInCycle(from, cycle);
    this.validateIsTrainingInFuture(from);
    await this.validateOverlap(from, to, group.id, cycle.id);

    // warmup and cooldown components
    const { warmup, cooldown } =
      this.trainingPlanService.createWarmupAndCooldown(
        from,
        to,
        propsTraining.components,
      );

    // validate components & exercises
    const attributes = await this.cacheManagerService.getAttributes();
    const components = await this.cacheManagerService.getComponents();
    const exercises = await this.trainingPlanService.findAllTrainingExercises(
      user,
      propsTraining.components,
    );

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      group.membersIds,
      [warmup, ...propsTraining.components, cooldown],
      components,
    );

    // populate exercise params from components
    this.trainingPlanService.populateTrainingExerciseParams(
      propsTraining.components,
      components,
      exercises,
      attributes,
    );

    // create training
    const wellness = await this.userService.getRecentWellness(group.membersIds);
    const workloads = await this.workloadService.findAllByMembers(
      group.membersIds,
    );

    // create by copying a component from another training section
    let copyFromTraining: Training | undefined,
      trainingComponent: TrainingComponent | undefined,
      avgCompletedWorkloadValues: AverageWorkloadValues[] | undefined,
      avgFutureWorkloadValues: AverageWorkloadValues[] | undefined;

    if (copyFromTrainingId) {
      copyFromTraining = await this.findOneOrFail(user, {
        trainingId: copyFromTrainingId,
      });

      // frontend needs to pass only the copied component
      if (propsTraining.components.length !== 1) {
        throw new BadRequestException(
          'You can only copy a training with one component',
        );
      }

      trainingComponent = propsTraining.components[0];
      if (!trainingComponent) {
        throw new BadRequestException(
          'You must provide a training component to copy',
        );
      }

      // keep avg workload values for exercises of only the copied component
      const exerciseIdsToKeep = trainingComponent.supersets
        .map((superset) => superset.exercises.map((e) => e.id))
        .flat();
      avgCompletedWorkloadValues =
        copyFromTraining.avgCompletedWorkloadValues.filter((w) =>
          exerciseIdsToKeep.includes(w.exerciseId),
        );
      avgFutureWorkloadValues = copyFromTraining.avgFutureWorkloadValues.filter(
        (w) => exerciseIdsToKeep.includes(w.exerciseId),
      );
    }

    const data: Create<Training> = {
      id: null,
      groupId: group.id,
      cycleId: propsTraining.cycleId,
      ownerId: user.uid,
      copiedFromId: null,
      from,
      to,
      membersIds: group.membersIds,
      wellness,
      completedMembersIds: [],
      avgCompletedWorkloadValues: avgCompletedWorkloadValues || [],
      avgFutureWorkloadValues: avgFutureWorkloadValues || [],
      warmup,
      cooldown,
      components:
        // copy with component
        trainingComponent && copyFromTrainingId
          ? [
              {
                id: trainingComponent.id,
                from,
                to: dayjs(from).add(30, 'minute').toDate(),
                color: trainingComponent.color,
                subgroups: trainingComponent.subgroups || [],
                supersets: trainingComponent.supersets || [],
                copiedFrom: {
                  lastCopiedFromTrainingId: copyFromTrainingId,
                  rootCopiedFromTrainingId: trainingComponent.copiedFrom
                    ? trainingComponent.copiedFrom.rootCopiedFromTrainingId
                    : copyFromTrainingId,
                },
                completedMembersIds: [],
              },
            ]
          : // normal create training
            propsTraining.components.map((c) => ({
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

    await this.workloadService.createForTraining(batch, training, workloads);
    await batch.commit();

    return training;
  }

  // old, not used anymore
  async createWithTrainingComponent(
    user: User,
    ref: TrainingRef,
    input: {
      trainingComponent: TrainingComponent;
      date: { from: Date; to: Date };
    },
  ): Promise<Training> {
    const { trainingComponent, date } = input;
    this.logger.log(
      `User ${user.uid} is creating training with training component: ${JSON.stringify(input)}`,
    );

    const copyFromTraining = await this.findOneOrFail(user, ref);
    const cycleId = copyFromTraining.cycleId;
    const groupId = copyFromTraining.groupId;

    // validate parent references
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);
    const from = date.from;
    const to = date.to;

    this.validateOwner(user.uid, group);
    this.checkTrainingIsInCycle(from, cycle);
    this.validateIsTrainingInFuture(from);
    await this.validateOverlap(from, to, group.id, cycle.id);

    // warmup and cooldown components
    const { warmup, cooldown } =
      this.trainingPlanService.createWarmupAndCooldown(from, to, [
        trainingComponent,
      ]);

    // validate components & exercises
    const attributes = await this.cacheManagerService.getAttributes();
    const components = await this.cacheManagerService.getComponents();
    const exercises = await this.trainingPlanService.findAllTrainingExercises(
      user,
      [trainingComponent],
    );

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      group.membersIds,
      [warmup, trainingComponent, cooldown],
      components,
    );

    // populate exercise params from components
    this.trainingPlanService.populateTrainingExerciseParams(
      [trainingComponent],
      components,
      exercises,
      attributes,
    );

    // create training
    const wellness = await this.userService.getRecentWellness(group.membersIds);
    const workloads = await this.workloadService.findAllByMembers(
      group.membersIds,
    );

    // keep avg workload values for exercises of only the copied component
    const exerciseIdsToKeep = trainingComponent.supersets
      .map((superset) => superset.exercises.map((e) => e.id))
      .flat();
    const avgCompletedWorkloadValues =
      copyFromTraining.avgCompletedWorkloadValues.filter((w) =>
        exerciseIdsToKeep.includes(w.exerciseId),
      );
    const avgFutureWorkloadValues =
      copyFromTraining.avgFutureWorkloadValues.filter((w) =>
        exerciseIdsToKeep.includes(w.exerciseId),
      );

    const data: Create<Training> = {
      id: null,
      groupId: group.id,
      cycleId,
      ownerId: user.uid,
      copiedFromId: null,
      from,
      to,
      membersIds: group.membersIds,
      wellness,
      completedMembersIds: [],
      avgCompletedWorkloadValues: avgCompletedWorkloadValues,
      avgFutureWorkloadValues: avgFutureWorkloadValues,
      warmup,
      cooldown,
      components: [
        {
          id: trainingComponent.id,
          from,
          to: dayjs(from).add(30, 'minute').toDate(),
          color: trainingComponent.color,
          subgroups: trainingComponent.subgroups || [],
          supersets: trainingComponent.supersets || [],
          copiedFrom: {
            lastCopiedFromTrainingId: ref.trainingId,
            rootCopiedFromTrainingId: trainingComponent.copiedFrom
              ? trainingComponent.copiedFrom.rootCopiedFromTrainingId
              : ref.trainingId,
          },
          completedMembersIds: [],
        },
      ],
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

    await this.workloadService.createForTraining(batch, training, workloads);
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
    await this.workloadService.createForTraining(batch, updated, workloads);
    await batch.commit();

    return updated;
  }

  async batchUpdate(
    user: User,
    ref: CycleRef,
    body: BatchUpdateTrainingsWithCustomAthleteWorkloadsDto,
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
    input: Partial<
      Pick<Training, 'groupId' | 'cycleId' | 'membersIds' | 'from'>
    >,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is copying training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    const training = await this.findOneOrFail(user, ref);
    const { groupId, cycleId } = training;
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);

    const membersIds = input.membersIds || training.membersIds;

    const wellness = await this.userService.getRecentWellness(membersIds);
    const trainingTo = addMinutes(
      startOfHour(input.from),
      training.components.length * 30,
    );

    const data: Create<Training> = {
      id: null,
      groupId: training.groupId,
      cycleId: training.cycleId,
      ownerId: user.uid,
      copiedFromId: training.id,
      from: input.from,
      to: trainingTo,
      membersIds: training.membersIds,
      wellness,
      completedMembersIds: [],
      avgCompletedWorkloadValues: training.avgCompletedWorkloadValues || [],
      avgFutureWorkloadValues: training.avgFutureWorkloadValues || [],
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
        to: input.from,
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

    await this.workloadService.createForTraining(
      batch,
      copiedTraining,
      workloads,
    );
    await batch.commit();

    return copiedTraining;
  }

  // old, not used anymore
  async copyComponent(
    user: User,
    ref: TrainingRef,
    input: {
      trainingComponent: TrainingComponent;
      copiedFromTrainingId: string;
      overwrite?: boolean;
    },
  ): Promise<Training> {
    const { trainingComponent, copiedFromTrainingId, overwrite } = input;
    this.logger.log(
      `User ${user.uid} is copying component ${trainingComponent.id} to ${ref.trainingId}`,
    );

    const training = await this.findOneOrFail(user, ref);
    this.validateOwner(user.uid, training);

    let from = training.from;
    let to = training.to;
    if (training.components.length) {
      const lastTrainingComponentInTraining = training.components
        .map((c) => c.to)
        .sort((a: Date, b: Date) => {
          return new Date(b).getTime() - new Date(a).getTime();
        })[0];
      from = lastTrainingComponentInTraining
        ? addMinutes(lastTrainingComponentInTraining, 30)
        : training.from;
      to = lastTrainingComponentInTraining
        ? addMinutes(lastTrainingComponentInTraining, 60)
        : trainingComponent.to;
    }

    const newComponent = {
      id: trainingComponent.id,
      from: from,
      to: to,
      color: trainingComponent.color,
      subgroups: trainingComponent.subgroups || [],
      supersets: trainingComponent.supersets || [],
      copiedFrom: {
        lastCopiedFromTrainingId: copiedFromTrainingId,
        rootCopiedFromTrainingId: trainingComponent.copiedFrom
          ? trainingComponent.copiedFrom.rootCopiedFromTrainingId
          : copiedFromTrainingId,
      },
    } as TrainingComponent;

    let newComponents: TrainingComponent[];
    if (overwrite) {
      newComponents = training.components.map((c) => {
        if (c.id === trainingComponent.id) return newComponent;
        return c;
      });
    } else {
      newComponents = [...training.components, newComponent];
    }

    const components = await this.cacheManagerService.getComponents();
    const exercises = await this.trainingPlanService.findAllTrainingExercises(
      user,
      newComponents,
    );

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      [],
      [training.warmup, ...newComponents, training.cooldown],
      components,
    );

    const updated = {
      ...training,
      components: newComponents,
    };

    const trainingDocRef = this.trainingRepository.doc(ref.trainingId);
    const updateTrainingQuery = this.firebaseService.buildUpdateQuery<Training>(
      { ...updated },
    );

    const batch = this.firebaseService.firestore.batch();
    batch.update(trainingDocRef, updateTrainingQuery);
    await batch.commit();

    return updated;
  }

  async remove(user: User, ref: TrainingRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing training ${ref.trainingId}`);

    const training = await this.findOneOrFail(user, ref);
    this.validateOwner(user.uid, training);
    this.validateIsTrainingInFuture(training.from);

    const workloads = await this.workloadService.findAllByTraining(
      ref.trainingId,
    );
    const notStartedWorkloads = workloads.filter(
      (w) => w.status === SetStatus.NOT_STARTED,
    );

    // delete non started workloads
    await this.workloadService.deleteWorkloads(notStartedWorkloads);

    await this.trainingRepository.deleteDoc(ref.trainingId);
  }

  async updateWorkloads(
    user: User,
    ref: Omit<WorkloadRef, 'exerciseId' | 'setNumber'>,
    input: CreateWorkload[],
  ) {
    this.logger.log(
      `User ${user.uid} is creating workloads for component ${ref.componentId} for training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    if (user.uid !== ref.userId) throw new UnauthorizedException();
    // TODO - trainer can also create workloads for his athletes

    const workloads: Workload[] = (
      await this.workloadService.findAllByTraining(ref.trainingId)
    )
      .filter((w) => w.userId === ref.userId)
      .map((w) => {
        const provided = input.find(
          (workload) =>
            workload.exerciseId === w.exerciseId &&
            workload.setNumber === w.setNumber,
        );

        if (!provided) return null;
        return { ...w, ...provided };
      })
      .filter((w) => w);

    const batch = this.firebaseService.firestore.batch();
    await this.workloadService.updateByTrainingComponent(batch, ref, workloads);
    await batch.commit();
  }

  async finishComponent(
    user: User,
    ref: TrainingRef & ComponentRef,
    input: FinishComponentDto,
  ): Promise<Training> {
    const { trainingId, componentId } = ref;
    const { userId, rootComponentId, supersets } = input;
    this.logger.log(
      `User ${user.uid} is finishing component ${componentId} for user ${input.userId} for training ${trainingId}`,
    );

    if (user.uid !== userId)
      throw new UnauthorizedException(
        'You are not allowed to perform this action',
      );

    const workloads = await this.workloadService.findAllByTrainingUserComponent(
      {
        trainingId: ref.trainingId,
        userId,
        componentId,
      },
    );

    const batch = this.firebaseService.firestore.batch();

    const completedExercises = supersets
      .map((superset) => superset.exercises.map((exercise) => exercise))
      .flat();

    // update workloads
    for (const workload of workloads) {
      const docRef = this.workloadService.getDoc(workload);
      const completedExercise = completedExercises.find(
        (e) => e.id === workload.exerciseId,
      );
      const correctSet = completedExercise.sets.find(
        (s) => s.setNumber === workload.setNumber,
      );

      const {
        volWork1Value,
        volWork2Value,
        volRecValue,
        intWork1Value,
        intWork2Value,
        intRecValue,
      } = this.getWorkloadValues(correctSet, workload);

      batch.update(docRef, {
        status: SetStatus.COMPLETED,
        finishedAt: new Date(),
        volWork1Value: volWork1Value,
        volWork2Value: volWork2Value,
        volRecValue: volRecValue,
        intWork1Value: intWork1Value,
        intWork2Value: intWork2Value,
        intRecValue: intRecValue,
      });
    }

    const training = await this.findOneOrFail(user, ref);

    // update avg completed workload values
    for (const completedExercise of completedExercises) {
      let avgIntensity = 0;
      let avgVolume = 0;

      const workload = workloads.find(
        (w) => w.exerciseId === completedExercise.id,
      );

      for (const set of completedExercise.sets) {
        const { volWork1Value, intWork1Value } = this.getWorkloadValues(
          set,
          workload,
        );

        if (intWork1Value && volWork1Value) {
          avgIntensity += parseFloat(intWork1Value);
          avgVolume += parseFloat(volWork1Value);
        }
      }

      if (avgIntensity === 0 || avgVolume === 0) continue;

      avgIntensity = avgIntensity / completedExercise.sets.length;
      avgVolume = avgVolume / completedExercise.sets.length;

      const foundAvgCompletedWorkload =
        training.avgCompletedWorkloadValues.find(
          (w) => w.exerciseId === completedExercise.id,
        );

      if (!foundAvgCompletedWorkload) {
        training.avgCompletedWorkloadValues.push({
          exerciseId: completedExercise.id,
          rootComponentId,
          numMembers: 1,
          avgWorkloadValue: {
            intensity: avgIntensity,
            volume: avgVolume,
          },
        });

        // we can optimize the training object here by removing the entry with the same exerciseId from avgFutureWorkloadValues if needed
      } else {
        foundAvgCompletedWorkload.numMembers++;
        foundAvgCompletedWorkload.avgWorkloadValue.intensity =
          (foundAvgCompletedWorkload.avgWorkloadValue.intensity *
            (foundAvgCompletedWorkload.numMembers - 1) +
            avgIntensity) /
          foundAvgCompletedWorkload.numMembers;
        foundAvgCompletedWorkload.avgWorkloadValue.volume =
          (foundAvgCompletedWorkload.avgWorkloadValue.volume *
            (foundAvgCompletedWorkload.numMembers - 1) +
            avgVolume) /
          foundAvgCompletedWorkload.numMembers;
      }
    }

    const component = [
      training.warmup,
      ...training.components,
      training.cooldown,
    ].find((c) => c.id === componentId);
    if (!component) throw new BadRequestException('Component not found');
    component.completedMembersIds.push(userId);

    const hasCompletedTraining = [
      training.warmup,
      ...training.components,
      training.cooldown,
    ].every((c) => c.completedMembersIds.includes(userId));
    if (hasCompletedTraining) {
      training.completedMembersIds.push(userId);
    }

    const trainingDocRef = this.trainingRepository.doc(trainingId);
    const updateTrainingQuery = this.firebaseService.buildUpdateQuery<Training>(
      {
        components: training.components,
        completedMembersIds: training.completedMembersIds,
        avgCompletedWorkloadValues: training.avgCompletedWorkloadValues,
        warmup: training.warmup,
        cooldown: training.cooldown,
      },
    );

    batch.update(trainingDocRef, updateTrainingQuery);
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

      const workloads = await this.workloadService.findAllByTraining(
        ref.trainingId,
      );
      const notStartedWorkloads = workloads.filter(
        (w) => w.status === SetStatus.NOT_STARTED,
      );

      // delete non started workloads
      await this.workloadService.deleteWorkloads(notStartedWorkloads);
      
      await this.trainingRepository.deleteDoc(ref.trainingId);
    } else await this.trainingRepository.updateDoc(ref.trainingId, query);

    return updatedTraining;
  }

  private getWorkloadValues(set: ExerciseSet, workload: Workload) {
    const volWork1Value = set.paramValuesL.find(
      (p) => p.field === ParamType.VolWork1,
    )?.value;
    const volWork2Value = set.paramValuesL.find(
      (p) => p.field === ParamType.VolWork2,
    )?.value;
    const volRecValue = set.paramValuesL.find(
      (p) => p.field === ParamType.VolRec1,
    )?.value;
    const intWork1Value = set.paramValuesL.find(
      (p) => p.field === ParamType.IntWork1,
    )?.value;
    const intWork2Value = set.paramValuesL.find(
      (p) => p.field === ParamType.IntWork2,
    )?.value;
    const intRecValue = set.paramValuesL.find(
      (p) => p.field === ParamType.IntRec1,
    )?.value;

    return {
      volWork1Value,
      volWork2Value,
      volRecValue,
      intWork1Value,
      intWork2Value,
      intRecValue,
    };
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
