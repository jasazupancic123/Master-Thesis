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
  addHours,
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
  BatchWriteOperation,
  ComponentRef,
  CycleRef,
  GroupRef,
  TrainingComponentRef,
  TrainingRef,
  UserRef,
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
import { SetStatus } from '../enum/set-status.enum';
import { ParamType } from '../../component/enum/param.enum';
import { FinishComponentDto } from '../dto/finish-component.dto';
import { CreateTrainingDto } from '../dto/create-training.dto';
import { PeriodizeTrainingsDto } from '../dto/periodize-training.dto';
import { PeriodizationService } from './periodization.service';
import { FindByDayDto } from '../dto/find-by-day.dto';
import { CopyComponentDto } from '../dto/copy-component.dto';
import { BatchUpdateTrainingsDto } from '../dto/update-training.dto';
import { FindAthleteGroupWorkloads } from '../dto/find-workload.dto';
import { CopyTrainingDto } from '../dto/copy-training.dto';
import { Permission } from '../../common/interface/permission.interface';
import { Institution } from '../../institution/entity/institution.entity';
import { InstitutionService } from '../../institution/service/institution.service';
import { AttributeService } from '../../attribute/service/attribute.service';
import { ComponentService } from '../../component/component.service';
import { MethodService } from '../../method/service/method.service';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';
import { PeriodizationType } from '../enum/periodization-type.enum';
import { FindByDayAndPeriodDto } from '../dto/find-by-day-period-dto';

@Injectable()
export class TrainingService implements Permission<Training, Institution> {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly attributeService: AttributeService,
    private readonly componentService: ComponentService,
    private readonly methodService: MethodService,
    private readonly userService: UserService,
    private readonly periodizationService: PeriodizationService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadService: WorkloadService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    @Inject(forwardRef(() => InstitutionService))
    private readonly institutionService: Wrapper<InstitutionService>,
  ) {}

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return query(this.trainingRepository.collection()).get();
  }

  async getDocsByGroup(groupId: string) {
    return this.trainingRepository
      .collection()
      .where('groupId', '==', groupId)
      .orderBy('from', 'asc')
      .get();
  }

  async findOneById(
    user: User,
    ref: TrainingRef,
    options?: { skipInstitution?: boolean },
  ): Promise<Training | null> {
    // find training
    const training = await this.trainingRepository.getDoc(ref.trainingId);
    if (!training || training.deletedAt) return null;

    if (!options?.skipInstitution)
      if (training.institutionId)
        training.institution = await this.institutionService.getDoc({
          institutionId: training.institutionId,
        });

    this.validateCanView(user, training, training.institution);
    return training;
  }

  async findOneByIdOrFail(
    user: User,
    ref: TrainingRef,
    options?: { skipInstitution?: boolean },
  ): Promise<Training> {
    const training = await this.findOneById(user, ref, options);
    if (!training) throw new BadRequestException('Training not found');
    return training;
  }

  async findAll(user: User, filter?: Filter<Training>): Promise<Training[]> {
    const from = filter?.from ? filter.from : undefined;
    const to = filter?.to ? filter.to : undefined;

    let trainings = await this.trainingRepository.getDocs((q) => {
      // filter by date
      // TODO - does not work yet
      if (from && to) q = q.where('from', '>=', from).where('from', '<', to);

      // filter by roles
      if (
        this.firebaseService.isTrainer(user) ||
        this.firebaseService.isManager(user)
      )
        q = q.where('ownerId', '==', user.uid);
      else if (this.firebaseService.isAthlete(user))
        q = q.where('membersIds', 'array-contains', user.uid);

      // filter by other params
      if (filter?.groupId) q = q.where('groupId', '==', filter.groupId);
      if (filter?.cycleId) q = q.where('cycleId', '==', filter.cycleId);

      q = q.orderBy('from', 'asc');
      return q;
    });

    /* if (from && to)
      trainings = trainings.filter((t) =>
        this.commonService.date.isBetween(t.from, from, to),
      ); */

    return trainings;
  }

  async findByDayAndPeriod(
    user: User,
    ref: GroupRef,
    input: FindByDayAndPeriodDto,
  ): Promise<{ training: Training | null }> {
    this.logger.log(
      `User ${user.uid} is getting trainings for day: ${JSON.stringify(input)}`,
    );

    const { groupId } = ref;
    const { day, period } = input;
    const startOfDayDate = startOfDay(day);
    const endOfDayDate = endOfDay(day);

    // validate group
    await this.groupService.findOneByIdOrFail(user, ref);

    // find trainings
    const trainings = await this.trainingRepository.getDocs((q) => {
      q = q.where('groupId', '==', groupId);
      q = q.where('from', '>=', startOfDayDate);
      q = q.where('to', '<=', endOfDayDate);
      if (period === 'AM')
        q = q.where('from', '<', addHours(startOfDayDate, 12));
      else if (period === 'PM')
        q = q.where('from', '>=', addHours(startOfDayDate, 12));
      return q;
    });

    const training = trainings && trainings.length ? trainings[0] : null;

    return { training };
  }

  async findByIdAndPopulateAthleteWorkloads(
    user: User,
    ref: TrainingRef & ComponentRef,
  ): Promise<Training> {
    const { trainingId, componentId } = ref;
    this.logger.log(`User ${user.uid} is getting training ${trainingId}`);

    const training = await this.findOneByIdOrFail(user, { trainingId });

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

  async create(user: User, input: CreateTrainingDto): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
    );

    // validate parent references
    const { groupId, cycleId } = input;
    let group: Group | null = null;
    if (groupId)
      group = await this.groupService.findOneByIdOrFail(user, { groupId });

    this.validateCanAdd(user, group.institution);

    let cycle: Cycle | null = null;
    if (group && cycleId)
      cycle = this.groupService.findCycleOrFail(cycleId, group);

    const { from, to } = this.getFromAndToDates(input.components);
    this.validateIsDateInCycle(from, cycle);
    this.validateIsDateInFuture(from);
    await this.validateOverlap(
      from,
      to,
      group.id,
      cycle.id,
      group.institutionId,
    );

    // warmup and cooldown components
    const { warmup, cooldown } =
      this.trainingPlanService.createWarmupAndCooldown(
        from,
        to,
        input.components,
      );

    // validate components & exercises
    const exercises = await this.trainingPlanService.getAllTrainingExercises(
      input.components,
    );

    await Promise.all(
      exercises.map((exercise) =>
        this.trainingPlanService.validateCanViewExercise(user, exercise),
      ),
    );

    const attributes = await this.attributeService.findAll();
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();
    const membersIds = group ? group.membersIds : input.membersIds;

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      membersIds,
      [warmup, ...input.components, cooldown],
      components,
      methods,
    );

    // populate exercise params from components
    this.trainingPlanService.populateTrainingExerciseParams(
      input.components,
      components,
      exercises,
      attributes,
    );

    // create training
    const wellness = await this.userService.getRecentWellness(membersIds);
    const workloads = await this.workloadService.findAllByMembers(membersIds);

    const data: Create<Training> = {
      id: null,
      institutionId: group.institutionId,
      groupId: group.id,
      cycleId: input.cycleId,
      ownerId: user.uid,
      copiedFromId: input.copiedFromId || null,
      from,
      to,
      membersIds,
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
        target: c.target || null,
        methodId: c.methodId || null,
        completedMembersIds: [],
        copiedFrom: c.copiedFrom || null,
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

    // create training, create workloads
    const batch = this.firebaseService.firestore.batch();
    batch.set(trainingDocRef, createTrainingQuery);
    this.workloadService.createForTraining(batch, training, workloads);
    await batch.commit();

    return training;
  }

  async periodize(user: User, input: PeriodizeTrainingsDto) {
    const {
      baseTrainingId,
      componentId,
      periodizationType,
      exerciseIds,
      subgroupId,
    } = input;

    this.logger.log(
      `User ${user.uid} is periodizing trainings: ${JSON.stringify(input)}`,
    );

    this.trainingPlanService.checkPeriodizationType(periodizationType);
    if ([WARMUP_COMPONENT_ID, COOLDOWN_COMPONENT_ID].includes(componentId))
      throw new BadRequestException(
        'You cannot periodize warmup or cooldown components',
      );

    const baseTraining = await this.findOneByIdOrFail(user, {
      trainingId: baseTrainingId,
    });

    const baseComponent = this.trainingPlanService.findComponentOrFail(
      baseTraining,
      componentId,
    );

    if (!subgroupId) baseComponent.periodizationType = periodizationType;
    const baseSubgroup = baseComponent.subgroups.find(
      (sg) => sg.id === subgroupId,
    );

    const mainTarget = baseComponent.target;
    if (baseSubgroup) baseSubgroup.periodizationType = periodizationType;

    const possibleTrainings = await this.trainingRepository.getDocs((q) =>
      q
        .where('groupId', '==', baseTraining.groupId)
        .where('cycleId', '==', baseTraining.cycleId)
        .where('from', '>', baseTraining.from)
        .orderBy('from', 'asc')
        .limit(50),
    );

    // target can be null/undefined, then just get the trainings without a target
    const filteredTrainings = possibleTrainings.filter((t) =>
      t.components.some((c) =>
        c.id === componentId && mainTarget
          ? c.target?.id === mainTarget.id
          : !c.target,
      ),
    );

    const lastTraining = filteredTrainings[filteredTrainings.length - 1];
    const weeks = this.trainingPlanService.getSpacedTrainingsByWeek(
      baseTraining,
      lastTraining,
      filteredTrainings,
    );

    let numberOfSubgroupsFound = 0;
    for (const ft of filteredTrainings) {
      let component = ft.components.find((c) => c.id === componentId);
      if (!component) continue;

      // no subgroup is selected, copy and periodize everything
      if (!subgroupId) {
        component = {
          ...structuredClone(baseComponent),
          id: component.id,
          from: addMinutes(ft.from, ft.components.length * 30),
          to: addMinutes(ft.from, ft.components.length * 30 + 30),
          completedMembersIds: [],
          copiedFrom: {
            lastCopiedFromTrainingId: baseTraining.id,
            rootCopiedFromTrainingId: baseComponent.copiedFrom
              ? baseComponent.copiedFrom.rootCopiedFromTrainingId
              : baseTraining.id,
          },
        };

        ft.components = ft.components.filter((c) => c.id !== componentId);
        ft.components.push(component);
      } else if (baseSubgroup) {
        // find subgroup in component by matching membersIds
        const subgroupInComponent = component.subgroups.find(
          (sg) => sg.id === baseSubgroup.id || sg.name === baseSubgroup.name,
        );

        if (!subgroupInComponent) continue;

        numberOfSubgroupsFound++;

        component = {
          ...structuredClone(baseComponent),
          id: component.id,
          from: addMinutes(ft.from, ft.components.length * 30),
          to: addMinutes(ft.from, ft.components.length * 30 + 30),
          completedMembersIds: [],
          copiedFrom: {
            lastCopiedFromTrainingId: baseTraining.id,
            rootCopiedFromTrainingId: baseComponent.copiedFrom
              ? baseComponent.copiedFrom.rootCopiedFromTrainingId
              : baseTraining.id,
          },
          supersets: component.supersets,
          subgroups: component.subgroups.map((sg) => {
            if (sg.id === subgroupInComponent.id)
              return {
                ...structuredClone(baseSubgroup),
                id: sg.id,
                periodizationType: periodizationType,
              };
            return sg;
          }),
        };

        ft.components = ft.components.filter((c) => c.id !== componentId);
        ft.components.push(component);
      }
    }

    if (baseSubgroup && !numberOfSubgroupsFound)
      throw new BadRequestException(
        `Selected subgroup not found in any future training`,
      );

    const periodizedTrainings =
      periodizationType !== PeriodizationType.REPLICATE
        ? (this.periodizationService.periodize(
            subgroupId ? baseSubgroup : baseTraining,
            filteredTrainings,
            weeks,
            componentId,
            periodizationType,
            exerciseIds,
            baseSubgroup?.id,
            baseSubgroup?.name,
          ) as Training[])
        : filteredTrainings;

    // update futureStats of baseTraining
    baseTraining.futureStats =
      this.trainingPlanService.createFutureTrainingStats(
        [baseComponent],
        baseTraining.membersIds.length,
      );

    await this.trainingRepository.updateDoc(baseTrainingId, {
      components: baseTraining.components.map((c) =>
        c.id === componentId && !subgroupId ? { ...c, periodizationType } : c,
      ),
    });

    // calculate new avg future workload values
    // const operations: BatchWriteOperation<Training>[] = [];
    const batch = this.firebaseService.firestore.batch();
    for (const t of filteredTrainings) {
      const component = t.components.find((c) => c.id === componentId);
      if (!component) continue;

      t.futureStats = this.trainingPlanService.createFutureTrainingStats(
        [component],
        t.membersIds.length,
      );

      /* operations.push({
        ref: this.trainingRepository.doc(t.id),
        data: this.firebaseService.buildUpdateQuery<Training>({ ...t }),
        operation: 'update',
      }); */

      const ref = this.trainingRepository.doc(t.id);
      batch.update(
        ref,
        this.firebaseService.buildUpdateQuery<Training>({ ...t }),
      );
    }

    await batch.commit();

    // await this.firebaseService.paginateBatchWrites(operations);

    periodizedTrainings.push(baseTraining);

    return periodizedTrainings.sort(
      (a, b) => a.from.getTime() - b.from.getTime(),
    );
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
    const training = await this.findOneByIdOrFail(user, ref);
    const { groupId, cycleId } = training;

    const group = await this.groupService.findOneByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);
    this.validateCanEdit(user, training, training.institution);

    // if no components, delete training
    if (input.components.length === 0) {
      await this.trainingRepository.deleteDoc(ref.trainingId);
      return {
        ...training,
        ...this.commonService.object.clean(input),
      };
    }

    const { from, to } = this.getFromAndToDates(input.components);
    this.validateIsDateInCycle(from, cycle);
    this.validateIsDateInFuture(from);
    await this.validateOverlap(
      from,
      to,
      groupId,
      cycleId,
      training.institutionId,
      training.id,
    );

    // validate components & exercises
    const attributes = await this.attributeService.findAll();
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();

    const membersIds = input.membersIds || training.membersIds;
    const members = await this.userService.findAllOrFail({ ids: membersIds });
    this.validateMembersInInstitution(members, training.institution);

    const exercises = await this.trainingPlanService.getAllTrainingExercises(
      input.components,
    );

    if (!input.warmup) input.warmup = training.warmup;
    if (!input.cooldown) input.cooldown = training.cooldown;

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
      methods,
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
    const group = await this.groupService.findOneByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);

    let institution: Institution | null = null;
    if (group.institutionId)
      institution = await this.institutionService.getDoc({
        institutionId: group.institutionId,
      });

    this.validateCanEdit(user, { ownerId: user.uid } as Training, institution);
    const methods = await this.methodService.findAll();
    const updated = [] as Training[];

    for (const data of input) {
      // validate training
      const training = await this.findOneByIdOrFail(
        user,
        { trainingId: data.id },
        { skipInstitution: true },
      );

      const flatTrainingIds = customAthleteWorkloads.flatMap(
        (cw) => cw.trainingId,
      );

      const trainings = flatTrainingIds.length
        ? await this.trainingRepository.getDocs((q) =>
            q.where('id', 'in', flatTrainingIds),
          )
        : [];

      const { from, to } = this.getFromAndToDates(data.components);
      this.validateIsDateInCycle(from, cycle);
      this.validateIsDateInFuture(from);
      await this.validateOverlap(
        from,
        to,
        groupId,
        cycleId,
        training.institutionId,
        training.id,
      );

      // validate components & exercises
      const attributes = await this.attributeService.findAll();
      const components = await this.componentService.findAllFlat();
      const membersIds = data.membersIds || training.membersIds;
      await this.userService.findAllOrFail({ ids: membersIds });

      const exercises = await this.trainingPlanService.getAllTrainingExercises(
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
        methods,
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

      const updatedTraining: Training = {
        ...training,
        ...this.commonService.object.clean(data),
        futureStats: this.trainingPlanService.createFutureTrainingStats(
          data.components,
          membersIds.length,
        ),
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

      this.workloadService.createForTraining(
        batch,
        updatedTraining,
        filteredWorkloads,
      );

      this.workloadService.createForCustomAthleteWorkloads(
        batch,
        customAthleteWorkloads,
        trainings,
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

    const training = await this.findOneByIdOrFail(user, ref);
    const { groupId, cycleId } = training;
    const group = await this.groupService.findOneByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);

    const wellness = await this.userService.getRecentWellness(
      training.membersIds,
    );

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
      trainingComponent = input.components[0];
      if (input.components.length !== 1)
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
      from: input.from,
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
          periodizationType: c.periodizationType || null,
          target: c.target || null,
          methodId: c.methodId || null,
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
    this.validateIsDateInCycle(input.from, cycle);
    this.validateIsDateInFuture(input.from);
    await this.validateOverlap(
      copiedTraining.from,
      copiedTraining.components[copiedTraining.components.length - 1].from,
      groupId,
      cycleId,
      training.institutionId,
    );

    // validate components & exercises in case user cannot view exercises of another user
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();

    const exercises = await this.trainingPlanService.getAllTrainingExercises(
      copiedTraining.components,
    );

    const membersIds =
      input.membersIds?.length > 0 ? input.membersIds : training.membersIds;

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      membersIds,
      [
        copiedTraining.warmup,
        ...copiedTraining.components,
        copiedTraining.cooldown,
      ],
      components,
      methods,
    );

    const copyTrainingQuery = this.firebaseService.buildCreateQuery<Training>(
      { ...data, id: copiedTraining.id },
      { timestamps: true },
    );

    const workloads = await this.workloadService.findAllByMembers(membersIds);

    // create training, add trainer to users, create workloads
    const batch = this.firebaseService.firestore.batch();
    batch.set(trainingDocRef, copyTrainingQuery);

    for (const userId of membersIds) {
      const docRef = this.userService.getDoc(userId);
      batch.update(docRef, {
        trainersIds: FieldValue.arrayUnion(user.uid),
      });
    }

    this.workloadService.createForTraining(batch, copiedTraining, workloads);
    await batch.commit();

    return copiedTraining;
  }

  async copyComponent(user: User, input: CopyComponentDto): Promise<Training> {
    const { copyFromTrainingId, copyToTrainingId, componentId } = input;

    this.logger.log(
      `User ${user.uid} is copying component ${componentId} from training ${copyFromTrainingId} to training ${copyToTrainingId}`,
    );

    const copyFromRef: TrainingRef = { trainingId: copyFromTrainingId };
    const copyToRef: TrainingRef = { trainingId: copyToTrainingId };

    const trainingFrom = await this.findOneByIdOrFail(user, copyFromRef);
    const trainingTo = copyToRef.trainingId
      ? await this.findOneById(user, copyToRef)
      : undefined;

    const trainingComponent = trainingFrom.components.find(
      (c) => c.id === componentId,
    );

    if (!trainingComponent)
      throw new BadRequestException('Component not found in training');

    if (!trainingTo) {
      // create a new training if it does not exist with the copied component
      // calculate new future stats
      const futureStats = trainingFrom.futureStats.filter(
        (fs) => fs.rootComponentId === componentId,
      );

      return await this.create(user, {
        ...trainingFrom,
        futureStats,
        components: [
          {
            ...trainingComponent,
            from: input.from,
            to: addMinutes(input.from, 30),
            copiedFrom: {
              lastCopiedFromTrainingId: trainingFrom.id,
              rootCopiedFromTrainingId: trainingComponent.copiedFrom
                ? trainingComponent.copiedFrom.rootCopiedFromTrainingId
                : trainingFrom.id,
            },
            completedMembersIds: [],
          },
        ],
      });
    }

    // copy component to existing training
    let from = trainingTo.from;
    let to = trainingTo.to;

    if (trainingTo.components.length) {
      const lastTrainingComponentInTraining = trainingTo.components
        .map((c) => c.to)
        .sort((a: Date, b: Date) => {
          return new Date(b).getTime() - new Date(a).getTime();
        })[0];
      from = lastTrainingComponentInTraining
        ? lastTrainingComponentInTraining
        : trainingTo.from;
      to = lastTrainingComponentInTraining
        ? addMinutes(lastTrainingComponentInTraining, 30)
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
        lastCopiedFromTrainingId: trainingFrom.id,
        rootCopiedFromTrainingId: trainingComponent.copiedFrom
          ? trainingComponent.copiedFrom.rootCopiedFromTrainingId
          : trainingFrom.id,
      },
    } as TrainingComponent;

    const foundTrainingComponent = trainingTo.components.find(
      (c) => c.id === trainingComponent.id,
    );

    const newComponents = !foundTrainingComponent
      ? [...trainingTo.components, newComponent] // if not found, add new component
      : // else, update existing component
        trainingTo.components.map((c) =>
          c.id === foundTrainingComponent.id
            ? { ...newComponent, from: c.from, to: c.to }
            : c,
        );

    return await this.update(user, copyToRef, { components: newComponents });
  }

  async remove(user: User, ref: TrainingRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing training ${ref.trainingId}`);

    const training = await this.findOneByIdOrFail(user, ref);
    const institution = await this.institutionService.getDoc({
      institutionId: training.institutionId,
    });

    this.validateCanEdit(user, training, institution);
    this.validateIsDateInFuture(training.from);

    const notStartedWorkloads = await this.workloadService.findAllByTraining(
      ref.trainingId,
      SetStatus.NOT_STARTED,
    );

    // delete non started workloads
    await this.workloadService.deleteWorkloads(notStartedWorkloads);
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
    const training = await this.findOneByIdOrFail(user, ref);
    const workloads = await this.workloadService.findAllByRef({
      userId: user.uid,
      trainingId,
      componentId,
    });

    // validation
    const exercises = input.supersets.flatMap((s) => s.exercises); // completed exercises
    const allComponents =
      this.trainingPlanService.getTrainingComponents(training);

    // FIX:
    // const allComponents = training.components
    // allComponents.unshift(training.warmup);
    // allComponents.push(training.cooldown);

    // mark user as completed (for component and training)
    const component = allComponents.find((c) => c.id === componentId);
    if (!component) throw new BadRequestException('Component not found');

    component.completedMembersIds.push(user.uid);
    if (this.trainingPlanService.isTrainingCompleted(user.uid, allComponents))
      training.completedMembersIds.push(user.uid);

    // update stats
    const stats = this.trainingPlanService.calculateCompletedTrainingStats(
      training.stats,
      exercises,
    );

    // update workloads
    const batch = this.firebaseService.firestore.batch();
    for (const w of workloads) {
      const exercise = exercises.find((e) => e.id === w.exerciseId);
      if (!exercise) continue;

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
        warmup: training.warmup,
        cooldown: training.cooldown,
        components: training.components,
        completedMembersIds: training.completedMembersIds,
        stats: [...(training.stats || []), ...stats],
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

    const training = await this.findOneByIdOrFail(user, ref);

    this.validateCanEdit(user, training, training.institution);
    this.validateIsDateInFuture(training.from);

    // validate components & exercises
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();

    const trainingComponents = [...training.components, ...input];
    const exercises =
      await this.trainingPlanService.getAllTrainingExercises(
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
      methods,
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
    const training = await this.findOneByIdOrFail(user, ref);
    this.validateCanEdit(user, training, training.institution);
    this.validateIsDateInFuture(training.from);

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

      const notStartedWorkloads = await this.workloadService.findAllByTraining(
        ref.trainingId,
        SetStatus.NOT_STARTED,
      );

      // delete non started workloads
      await this.workloadService.deleteWorkloads(notStartedWorkloads);

      await this.trainingRepository.deleteDoc(ref.trainingId);
    } else await this.trainingRepository.updateDoc(ref.trainingId, query);

    return updatedTraining;
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

  private async validateOverlap(
    from: Date,
    to: Date,
    groupId: string,
    cycleId: string,
    institutionId?: string,
    trainingId?: string,
  ) {
    const trainings = (
      await this.trainingRepository.getDocs((q) =>
        q
          .where('institutionId', '==', institutionId)
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

  private validateIsDateInCycle(from: Date, cycle: Cycle) {
    if (!this.commonService.date.isBetween(from, cycle.from, cycle.to))
      throw new BadRequestException(
        'Training falls outside of the selected cycle',
      );
  }

  private validateIsDateInFuture(
    from: Date,
    relativeDate = startOfDay(new Date()),
  ) {
    if (this.isInPast(from, relativeDate))
      throw new BadRequestException(
        'You cannot add or update trainings in the past',
      );
  }

  private isInPast(date: Date, relativeDate = new Date()) {
    return isBefore(date, relativeDate.setHours(0, 0, 0, 0));
  }

  private validateMembersInInstitution(
    members: User[],
    institution?: Institution,
  ) {
    if (!institution) return;

    for (const member of members)
      if (!institution.athleteIds.includes(member.uid))
        throw new BadRequestException(
          `User ${member.displayName || member.email} is not part of institution`,
        );
  }

  validateCanView(user: User, training: Training, institution?: Institution) {
    if (!this.canView(user, training, institution))
      throw new UnauthorizedException('You cannot view this training');
  }

  validateCanEdit(user: User, training: Training, institution?: Institution) {
    if (!this.canEdit(user, training, institution))
      throw new UnauthorizedException('You cannot edit this training');
  }

  validateCanAdd(user: User, institution?: Institution) {
    if (!this.canAdd(user, institution))
      throw new UnauthorizedException('You cannot add training');
  }

  canView(user: User, training: Training, institution?: Institution) {
    if (training.ownerId === user.uid) return true;
    if (training.membersIds.includes(user.uid)) return true;

    if (institution) {
      if (institution.ownerId === user.uid) return true;
      if (institution.trainerIds.includes(user.uid)) return true;
      if (institution.athleteIds.includes(user.uid)) return true;
    }

    return false;
  }

  canEdit(user: User, training: Training, institution?: Institution) {
    if (this.firebaseService.isTrainer(user) && training.ownerId === user.uid)
      return true;

    if (institution) {
      if (
        this.firebaseService.isManager(user) &&
        institution.ownerId === user.uid
      )
        return true;

      if (
        this.firebaseService.isTrainer(user) &&
        institution.trainerIds.includes(user.uid)
      )
        return true;
    }

    return false;
  }

  canAdd(user: User, institution?: Institution) {
    if (this.firebaseService.isTrainer(user)) return true;

    if (institution) {
      if (
        this.firebaseService.isManager(user) &&
        institution.ownerId === user.uid
      )
        return true;

      if (
        this.firebaseService.isTrainer(user) &&
        institution.trainerIds.includes(user.uid)
      )
        return true;
    }

    return false;
  }
}
