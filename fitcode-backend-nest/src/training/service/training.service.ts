import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  addHours,
  addMinutes,
  endOfDay,
  isBefore,
  startOfDay,
  startOfHour,
  subMinutes,
} from 'date-fns';
import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';

import { AttributeService } from '@src/attribute/service/attribute.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create, Update } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import {
  BatchWriteOperation,
  ComponentRef,
  CycleRef,
  GroupRef,
  TrainingComponentRef,
  TrainingRef,
  UserRef,
} from '@src/common/type/firestore.type';
import { Filter } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { ComponentService } from '@src/component/component.service';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Cycle } from '@src/group/entity/cycle.entity';
import { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { InstitutionService } from '@src/institution/service/institution.service';
import { MethodService } from '@src/method/service/method.service';
import { UserService } from '@src/user/user.service';

import { CopyComponentDto } from '../dto/copy-component.dto';
import { CopyTrainingDto } from '../dto/copy-training.dto';
import { CreateTrainingDto } from '../dto/create-training.dto';
import { CreatePrescribedWorkloadDto } from '../dto/create-workload.dto';
import { FindByDayAndPeriodDto } from '../dto/find-by-day-period-dto';
import { FindAthleteGroupWorkloads } from '../dto/find-workload.dto';
import { PeriodizeTrainingsDto } from '../dto/periodize-training.dto';
import { BatchUpdateTrainingDto } from '../dto/update-training.dto';
import { CompletedTrainingComponent } from '../entity/completed-training.entity';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { Workload } from '../entity/workload.entity';
import { PeriodizationType } from '../enum/periodization-type.enum';
import { SetStatus } from '../enum/set-status.enum';
import { TrainingRepository } from '../repository/training.repository';
import { WorkloadRepository } from '../repository/workload.repository';
import { PeriodizationService } from './periodization.service';
import { TrainingPlanService } from './training-plan.service';
import { WorkloadService } from './workload.service';

@Injectable()
export class TrainingService implements Permission<Training, Institution> {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly commonService: CommonService,
    private readonly attributeService: AttributeService,
    private readonly componentService: ComponentService,
    private readonly methodService: MethodService,
    private readonly exerciseService: ExerciseService,
    private readonly userService: UserService,
    private readonly periodizationService: PeriodizationService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadRepository: WorkloadRepository,
    private readonly workloadService: WorkloadService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
    @Inject(forwardRef(() => InstitutionService))
    private readonly institutionService: Wrapper<InstitutionService>,
  ) {}

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return query(this.trainingRepository.collection()).get();
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

    const trainings = await this.trainingRepository.getDocs((q) => {
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

  @LogMethod()
  async findByDayAndPeriod(
    user: User,
    ref: GroupRef,
    input: FindByDayAndPeriodDto,
  ): Promise<{ training: Training | null }> {
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

  @LogMethod()
  async findAthleteGroupWorkloads(
    user: User,
    ref: GroupRef & UserRef,
    input: FindAthleteGroupWorkloads,
  ): Promise<{ completedWorkloads: Workload[]; futureWorkloads: Workload[] }> {
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

  @LogMethod()
  async create(user: User, input: CreateTrainingDto): Promise<Training> {
    // validate parent references
    const { groupId, cycleId } = input;
    let group: Group | null = null;
    let cycle: Cycle | null = null;

    if (groupId) {
      group = await this.groupService.findOneByIdOrFail(user, { groupId });
      this.validateCanAdd(user, group.institution);

      if (cycleId) cycle = this.groupService.findCycleOrFail(cycleId, group);
    }

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
    const wellness =
      await this.userService.getRecentWellnessForMany(membersIds);

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

    const id = await this.trainingRepository.addDoc(data);
    return {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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

  @LogMethod()
  async update(
    user: User,
    ref: TrainingRef,
    input: Update<Training> & { workloads?: CreatePrescribedWorkloadDto[] },
  ): Promise<Training> {
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

    // validate custom workloads
    if (input.workloads) {
      const inputWorkloads = await this.workloadService.validateWorkloads(
        training.id,
        input.workloads,
        input.components,
      );

      const existingWorkloads =
        await this.workloadService.findAllCustomByTraining(training.id);

      const operations: BatchWriteOperation<Workload>[] = [];
      for (const inputWorkload of inputWorkloads) {
        const existingWorkload = existingWorkloads.find(
          (w) =>
            w.componentId === inputWorkload.componentId &&
            w.exerciseId === inputWorkload.exerciseId &&
            w.userId === inputWorkload.userId &&
            w.supersetIndex === inputWorkload.supersetIndex &&
            w.setNumber === inputWorkload.setNumber,
        );

        if (existingWorkload)
          operations.push({
            operation: 'update',
            ref: this.workloadRepository.doc(existingWorkload),
            data: this.firebaseService.buildUpdateQuery(inputWorkload),
          });
        else
          operations.push({
            operation: 'set',
            ref: this.workloadRepository.doc({
              trainingId: training.id,
              userId: inputWorkload.userId,
              componentId: inputWorkload.componentId,
              exerciseId: inputWorkload.exerciseId,
              setNumber: inputWorkload.setNumber,
              supersetIndex: inputWorkload.supersetIndex,
            }),
            data: this.firebaseService.buildCreateQuery<Workload>(
              inputWorkload,
            ),
          });
      }

      const batch = this.firebaseService.firestore.batch();
      for (const { operation, ref, data } of operations) {
        if (operation === 'set') batch.set(ref, data);
        else if (operation === 'update') batch.update(ref, data);
      }

      await batch.commit();
    }

    // for future trainings, update latest meta and calculate workloads
    const wellness =
      await this.userService.getRecentWellnessForMany(membersIds);

    const updated = {
      ...training,
      ...this.commonService.object.clean(input),
      futureStats: this.trainingPlanService.createFutureTrainingStats(
        input.components,
        membersIds.length,
      ),
    };

    const trainingDocRef = this.trainingRepository.doc(ref.trainingId);
    const updateTrainingQuery = this.firebaseService.buildUpdateQuery<Training>(
      { ...input, wellness },
    );

    const batch = this.firebaseService.firestore.batch();
    batch.update(trainingDocRef, updateTrainingQuery);
    await batch.commit();

    return updated;
  }

  @LogMethod()
  async batchUpdate(
    user: User,
    ref: CycleRef,
    input: BatchUpdateTrainingDto[],
  ): Promise<Training[]> {
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
      const wellness =
        await this.userService.getRecentWellnessForMany(membersIds);

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

    const wellness = await this.userService.getRecentWellnessForMany(
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

    // create training, add trainer to users, create workloads
    const batch = this.firebaseService.firestore.batch();
    batch.set(trainingDocRef, copyTrainingQuery);

    for (const userId of membersIds) {
      const docRef = this.userService.getDoc(userId);
      batch.update(docRef, {
        trainersIds: FieldValue.arrayUnion(user.uid),
      });
    }

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

    await this.trainingRepository.deleteDoc(ref.trainingId);
  }

  @LogMethod()
  async completeTrainingComponent(
    user: User,
    ref: TrainingRef & ComponentRef,
    input: CompletedTrainingComponent,
  ): Promise<Training> {
    const { trainingId, componentId } = ref;
    const training = await this.findOneByIdOrFail(user, ref);

    // if training does not start within the current day, throw error
    if (
      !this.commonService.date.isBetween(
        training.from,
        startOfDay(new Date()),
        endOfDay(new Date()),
      )
    )
      throw new ConflictException('You cannot start this training');

    const trainingComponent = this.trainingPlanService.findComponentOrFail(
      training,
      componentId,
    );

    // validate athlete input for manager / trainer
    const athlete = await this.getAthlete(
      user,
      input.userId,
      training.institution,
    );

    if (trainingComponent.completedMembersIds.includes(athlete.uid))
      throw new ConflictException(
        this.firebaseService.isAthlete(user)
          ? `You have already completed this component`
          : `Athlete already completed this component`,
      );

    // create workloads
    await this.workloadService.createForTrainingComponent(
      trainingComponent,
      {
        institutionId: training.institutionId,
        groupId: training.groupId,
        cycleId: training.cycleId,
        trainingId,
        componentId,
        uid: athlete.uid,
      },
      input.exercises,
    );

    // update stats
    const stats = this.trainingPlanService.calculateTrainingStats(
      trainingComponent.id,
      training.stats,
      input.exercises,
    );

    // mark user as completed (for component and training)
    const [addCompletedMembersQuery, updatedTraining] =
      this.trainingPlanService.getAddCompletedMemberQuery(training, {
        componentId,
        uid: athlete.uid,
      });

    await this.trainingRepository.updateDoc(trainingId, {
      stats,
      ...addCompletedMembersQuery,
    });

    return updatedTraining;
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
      this.logger.log('No components left, deleting training');
      await this.trainingRepository.deleteDoc(ref.trainingId);
    } else await this.trainingRepository.updateDoc(ref.trainingId, query);

    return updatedTraining;
  }

  @LogMethod()
  async calculatePrescribedWorkloads /* user: User,
    ref: TrainingRef & { athleteId: string }, */() {
    /* const training = await this.findOneByIdOrFail(user, ref);
    const athlete = await this.getAthlete(
      user,
      ref.athleteId,
      training.institution,
    ); */
  }

  /**
   * Returns athlete user. If current user is athlete, it returns itself,
   * else if current user is trainer or manager, it returns found athlete
   * by athleteId if it exists and if it belongs to institution.
   */
  private async getAthlete(
    user: User,
    athleteId: string,
    institution?: Institution,
  ) {
    if (this.firebaseService.isAthlete(user)) return user;
    if (!athleteId) throw new BadRequestException('You must provide athlete');

    const found = await this.userService.findOneBy('id', athleteId);
    if (!found) throw new NotFoundException('Athlete does not exist');

    if (institution)
      if (!this.institutionService.canView(found, institution))
        throw new UnauthorizedException(
          `Athlete ${found.displayName || found.email} cannot view institution ${institution.name}`,
        );

    return found;
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
