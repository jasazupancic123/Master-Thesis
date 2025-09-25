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
import { OnEvent } from '@nestjs/event-emitter';
import {
  addMinutes,
  endOfDay,
  isBefore,
  isSameDay,
  startOfDay,
  subMinutes,
} from 'date-fns';
import { Query, Timestamp } from 'firebase-admin/firestore';

import { AuthService } from '@src/auth/auth.service';
import {
  DEFAULT_WEIGHT_KG,
  MIN_BODYWEIGHT_KG,
} from '@src/common/constant/weight.constant';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { UpdateMembersDto } from '@src/common/dto/user-id.dto';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create, Update } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import {
  ComponentRef,
  CycleRef,
  SubgroupRef,
  TrainingComponentRef,
  TrainingRef,
  UserRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import {
  BatchUpdateOperation,
  BatchWriteOperation,
} from '@src/common/type/orm.type';
import { Filter } from '@src/common/type/orm.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { logFirestoreQuery } from '@src/common/utils/firestore-query.util';
import { ComponentService } from '@src/component/component.service';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import { IntType, ParamType } from '@src/component/enum/param.enum';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { DELETE_GROUP_EVENT } from '@src/group/constant/delete-group-event.constant';
import { Cycle } from '@src/group/entity/cycle.entity';
import { Group } from '@src/group/entity/group.entity';
import { DeleteGroupOrCycleEvent } from '@src/group/event/delete-group.event';
import { GroupService } from '@src/group/group.service';
import { INSTITUTION_ATHLETE_EVENT } from '@src/institution/constant/update-institution-athlete-event.constant';
import { Institution } from '@src/institution/entity/institution.entity';
import { UpdateInstitutionAthleteEvent } from '@src/institution/event/update-institution-athlete.event';
import { InstitutionService } from '@src/institution/service/institution.service';
import { MethodService } from '@src/method/service/method.service';
import { PeriodizationService } from '@src/periodization/periodization.service';
import { WellnessService } from '@src/profile/service/wellness.service';

import {
  DURATION_TRAINING_COMPONENT_IN_MIN,
  DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
  MAX_NUM_TRAININGS_PER_DAY,
} from '../constant/training-limits.constant';
import { CompleteSetDto } from '../dto/complete-set.dto';
import {
  CreateTrainingComponentDto,
  CreateTrainingDto,
} from '../dto/create-training.dto';
import { PeriodizeTrainingsDto } from '../dto/periodize-training.dto';
import { CompletedTrainingComponent } from '../entity/completed-training.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Superset } from '../entity/superset.entity';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { TrainingReport } from '../entity/training-report.entity';
import { Workload } from '../entity/workload.entity';
import { MainSet } from '../enum/main-set.enum';
import { UpdateTraining } from '../interface/update-training.interface';
import { TrainingRepository } from '../repository/training.repository';
import { WorkloadRepository } from '../repository/workload.repository';
import { TrainingPlanService } from './training-plan.service';
import { TrainingReportService } from './training-report.service';
import { WorkloadService } from './workload.service';

@Injectable()
export class TrainingService implements Permission<Training, Institution> {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    private readonly commonService: CommonService,
    private readonly componentService: ComponentService,
    private readonly methodService: MethodService,
    private readonly periodizationService: PeriodizationService,
    private readonly wellnessService: WellnessService,
    private readonly repository: TrainingRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadRepository: WorkloadRepository,
    private readonly workloadService: WorkloadService,
    private readonly trainingReportService: TrainingReportService,
    private readonly groupService: GroupService,
    private readonly institutionService: InstitutionService,
    private readonly exerciseService: ExerciseService,
  ) {}

  async getDocs(query: (query: Query) => Query = (query) => query) {
    return query(this.repository.collection()).get();
  }

  async findOneById(
    user: User,
    ref: TrainingRef,
    options?: { skipInstitution?: boolean },
  ): Promise<Training | null> {
    // find training
    const training = await this.repository.findById(ref.trainingId);
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

  async findAll(
    user: User,
    filter?: Filter<Training>,
    options?: { limit?: number },
    populate?: boolean,
  ): Promise<Training[]> {
    const trainings = await this.repository.findAll(
      logFirestoreQuery(this.logger, (q) => {
        if (this.firebaseService.isTrainer(user))
          q = q.where('ownerId', '==', user.uid);
        else if (this.firebaseService.isAthlete(user))
          q = q.where('membersIds', 'array-contains', user.uid);

        // filter by other params
        if (filter?.institutionId)
          q.where('institutionId', '==', filter.institutionId);

        if (filter?.groupId) q = q.where('groupId', '==', filter.groupId);
        if (filter?.cycleId) q = q.where('cycleId', '==', filter.cycleId);

        if (filter?.from)
          q = q.where('from', '>=', Timestamp.fromDate(new Date(filter.from)));
        if (filter?.to)
          q = q.where('to', '<=', Timestamp.fromDate(new Date(filter.to)));

        q = q.orderBy('from', 'asc');
        if (options?.limit) q = q.limit(options.limit);

        return q;
      }),
    );

    if (populate) {
      const start = performance.now();

      const institutions: Institution[] = [];
      const groups: Group[] = [];

      for (const t of trainings) {
        const foundInstitution = institutions.find(
          (i) => i.id === t.institutionId,
        );

        const institution =
          foundInstitution || t.institutionId
            ? await this.institutionService.getDoc({
                institutionId: t.institutionId,
              })
            : undefined;

        const foundGroup = groups.find((g) => g.id === t.groupId);
        const group =
          foundGroup || t.groupId
            ? await this.groupService.findOneById(user, { groupId: t.groupId })
            : undefined;

        if (!foundInstitution && institution) institutions.push(institution);
        if (!foundGroup && group) groups.push(group);

        t.institution = institution;
        t.group = group;

        if (group)
          t.cycle = this.groupService.findCycleOrFail(t.cycleId, t.group);
      }

      const duration = this.commonService.number.round(
        performance.now() - start,
      );

      this.logger.debug(`findAll(populate=true): Took ${duration}ms`);
    }

    return trainings;
  }

  @LogMethod()
  async findReportsByUser(
    user: User,
    filter?: DateFilterDto,
  ): Promise<TrainingReport[]> {
    return await this.trainingReportService.findAllByUser(user.uid, filter);
  }

  @LogMethod()
  async findCompletedAthleteWorkloads(
    user: User,
    ref: TrainingRef & UserRef,
  ): Promise<Workload[]> {
    const training = await this.findOneByIdOrFail(user, ref);
    const athlete = await this.getAthlete(user, ref.uid, training.institution);

    const workloads = await this.workloadService.getDocs(ref, (q) =>
      q.where('userId', '==', athlete.uid),
    );

    return workloads;
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

    if (input.components.length === 0)
      throw new BadRequestException(
        'Training must have at least one component',
      );

    // update training times
    let from = input.from;
    const step = DURATION_TRAINING_COMPONENT_IN_MIN;

    const defaultComponentData = {
      mainSet: MainSet.BLOCK,
      supersets: [],
      subgroups: [],
    };

    const warmup: TrainingComponent = {
      ...defaultComponentData,
      id: WARMUP_COMPONENT_ID,
      from: subMinutes(
        from,
        DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
      to: from,
    };

    // input components
    const inputComponents: TrainingComponent[] = [warmup];
    inputComponents.push(
      ...input.components.map((c, i) => ({
        ...defaultComponentData,
        id: c.id,
        from: addMinutes(from, i * step),
        to: addMinutes(from, (i + 1) * step),
        target: c.target,
      })),
    );

    const cooldown: TrainingComponent = {
      ...defaultComponentData,
      id: COOLDOWN_COMPONENT_ID,
      from: inputComponents[inputComponents.length - 1].to,
      to: addMinutes(
        inputComponents[inputComponents.length - 1].to,
        DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
      ),
    };

    inputComponents.push(cooldown);
    this.validateIsDateInCycle(warmup.from, cycle);
    this.validateIsDateInFuture(warmup.from);
    await this.validateOverlapAndMaxLimit(
      user,
      { groupId, cycleId, trainingId: null }, // no trainingId for new training
      warmup.from,
      cooldown.to,
    );

    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();
    const membersIds = group ? group.membersIds : input.membersIds;

    this.trainingPlanService.validateTrainingComponents(
      inputComponents,
      membersIds,
      { components, methods, exercises: [] },
    );

    const data: Create<Training> = {
      id: null,
      institutionId: group?.institutionId,
      groupId: group?.id,
      cycleId: input.cycleId,
      ownerId: user.uid,
      copiedFromId: input.copiedFromId || null,
      from: warmup.from,
      to: cooldown.to,
      membersIds,
      stats: [],
      warmup,
      cooldown,
      components: inputComponents
        .filter(
          (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID,
        )
        .map((c) => ({
          id: c.id,
          from: c.from,
          to: c.to,
          target: c.target,
          methodId: c.methodId,
          copiedFrom: c.copiedFrom,
          mainSet: c.mainSet,
          subgroups: [],
          supersets: [],
        })),
    };

    const id = await this.repository.save(data);
    return { ...data, id, createdAt: new Date(), updatedAt: new Date() };
  }

  @LogMethod()
  async update(
    user: User,
    ref: TrainingRef,
    input: UpdateTraining,
  ): Promise<Training> {
    // validate training
    const training = await this.findOneByIdOrFail(user, ref);
    const { groupId, cycleId } = training;
    if (groupId && cycleId) {
      await this.groupService.findOneByIdOrFail(user, { groupId });
      this.validateCanEdit(user, training, training.institution);
    }

    // if no components, delete training
    if (input.components.length === 0) {
      await this.repository.delete(ref.trainingId);
      return training;
    }

    input.components.unshift(input.warmup);
    input.components.push(input.cooldown);

    // validate components & exercises
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();
    const exercises = await this.trainingPlanService.getAllTrainingExercises(
      input.components,
    );

    const trainingComponents: TrainingComponent[] = this.trainingPlanService
      .validateTrainingComponents(input.components, training.membersIds, {
        exercises,
        components,
        methods,
      })
      // override training times
      .map((c) => {
        const found = training.components.find((tc) => tc.id === c.id)!;
        return { ...c, from: found?.from, to: found?.to };
      });

    // validate custom workloads
    if (input.workloads) {
      const inputWorkloads = await this.workloadService.validateWorkloads(
        training.id,
        input.workloads,
        trainingComponents,
      );

      const operations: BatchWriteOperation<Workload>[] = [];
      for (const w of inputWorkloads) {
        const ref: WorkloadRef = { ...w, trainingId: training.id };
        w.id = this.workloadRepository.getKey(ref);

        operations.push({
          operation: 'set',
          data: this.firebaseService.buildCreateQuery<Workload>(w),
          ref: this.workloadRepository.doc(ref),
        });
      }

      const batch = this.firebaseService.firestore.batch();
      for (const { ref, data } of operations) batch.set(ref, data);
      await batch.commit();
    }

    const updateTraining: Update<Training> = {
      warmup: input.warmup,
      cooldown: input.cooldown,
      components: trainingComponents.filter(
        (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID,
      ),
    };

    await this.repository.update(ref.trainingId, updateTraining);
    return { ...training, ...updateTraining };
  }

  @LogMethod()
  async updateComponentTime(
    user: User,
    ref: TrainingComponentRef,
    input: DateRangeDto,
  ) {
    const training = await this.findOneByIdOrFail(user, ref);
    this.validateCanEdit(user, training, training.institution);

    this.trainingPlanService.findComponentOrFail(training, ref.componentId);
    if ([WARMUP_COMPONENT_ID, COOLDOWN_COMPONENT_ID].includes(ref.componentId))
      throw new BadRequestException(
        'You cannot update warmup and cooldown times',
      );

    this.validateIsDateInFuture(training.from);
    if (isBefore(input.to, input.from))
      throw new BadRequestException('Invalid date range');

    // input from and to must be on the same day as training from
    if (
      !isSameDay(input.from, training.from) ||
      !isSameDay(input.to, training.to)
    )
      throw new BadRequestException(
        'Input dates must be on the same day as training',
      );

    // validate overlap
    await this.validateOverlap(
      user,
      {
        groupId: training.groupId,
        cycleId: training.cycleId,
        trainingId: training.id,
      },
      input.from,
      input.to,
    );

    return await this.repository.updateComponentTime(
      training,
      ref.componentId,
      input,
    );
  }

  @LogMethod()
  async updateMembers(user: User, ref: TrainingRef, input: UpdateMembersDto) {
    const { userId: memberId, add } = input;

    // validate
    const training = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, training, training.institution))
      throw new UnauthorizedException('You are not allowed to update members');

    // check if member exists
    const member = await this.authService.findOneBy('id', memberId);
    if (!member) throw new BadRequestException('Member does not exist');
    if (!this.firebaseService.isAthlete(member))
      throw new BadRequestException('Member must be an athlete');

    // check if member is already in training
    if (training.membersIds.includes(member.uid) && add)
      throw new BadRequestException('Member is already in the training');

    // check if member is in institution
    if (!training.institution!.athleteIds.includes(member.uid))
      throw new BadRequestException('Member is not part of the institution');

    // update members
    if (add) await this.repository.addMember(training, member.uid);
    else await this.repository.removeMember(training, member.uid);
  }

  async remove(user: User, ref: TrainingRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing training ${ref.trainingId}`);

    const training = await this.findOneByIdOrFail(user, ref);
    this.validateCanEdit(user, training, training.institution);
    this.validateIsDateInFuture(training.from);

    await this.repository.delete(ref.trainingId);
  }

  @LogMethod()
  async addComponents(
    user: User,
    ref: TrainingRef,
    input: CreateTrainingComponentDto[],
  ): Promise<Training> {
    const training = await this.findOneByIdOrFail(user, ref);
    this.validateCanEdit(user, training, training.institution);
    this.validateIsDateInFuture(training.from);

    // validate components & exercises
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();

    const from = training.components[training.components.length - 1].to;
    const step = DURATION_TRAINING_COMPONENT_IN_MIN;

    const trainingComponents: TrainingComponent[] = [
      training.warmup,
      ...training.components,
      ...input.map((c, i) => ({
        ...c,
        id: c.id,
        from: addMinutes(from, i * step),
        to: addMinutes(from, (i + 1) * step),
        mainSet: MainSet.BLOCK,
        methodId: c.methodId,
        target: c.target,
        subgroups: [],
        supersets: [],
      })),
      {
        ...training.cooldown,
        from: addMinutes(from, input.length * step),
        to: addMinutes(
          from,
          input.length * step +
            DURATION_TRAINING_COMPONENT_WARMUP_COOLDOWN_IN_MIN,
        ),
      },
    ];

    const exercises =
      await this.trainingPlanService.getAllTrainingExercises(
        trainingComponents,
      );

    const validTrainingComponents = this.trainingPlanService
      .validateTrainingComponents(trainingComponents, training.membersIds, {
        exercises,
        components,
        methods,
      })
      .map((c) => {
        const found = trainingComponents.find((tc) => tc.id === c.id)!;
        return { ...c, from: found.from, to: found.to };
      });

    const last = validTrainingComponents[validTrainingComponents.length - 1];
    const query: Update<Training> = {
      warmup: validTrainingComponents[0],
      cooldown: last,
      components: validTrainingComponents.slice(1, -1),
      to: last.to,
    };

    // add components
    await this.repository.update(training.id, query);
    return { ...training, ...query };
  }

  @LogMethod()
  async deleteComponent(
    ref: TrainingComponentRef,
    user: User,
  ): Promise<Training> {
    // validate ownership
    const training = await this.findOneByIdOrFail(user, ref);
    this.validateCanEdit(user, training, training.institution);
    this.validateIsDateInFuture(training.from);

    const filtered = training.components.filter(
      (c) => c.id !== ref.componentId,
    );

    if (filtered.length === 0) {
      await this.repository.delete(ref.trainingId);
      return { ...training, components: [] };
    }

    const query = await this.repository.deleteComponent(
      training,
      ref.componentId,
    );

    return { ...training, ...query };
  }

  @LogMethod()
  async copyAndPeriodize(
    user: User,
    ref: TrainingComponentRef & SubgroupRef,
    input: PeriodizeTrainingsDto,
  ) {
    const { periodizationType, exerciseIds } = input;

    if ([WARMUP_COMPONENT_ID, COOLDOWN_COMPONENT_ID].includes(ref.componentId))
      throw new BadRequestException(
        'You cannot periodize warmup or cooldown components',
      );

    // if base training in the past, throw error
    const baseTraining = await this.findOneByIdOrFail(user, ref);
    if (this.isInPast(startOfDay(baseTraining.from)))
      throw new BadRequestException(
        'You can only periodize upcoming trainings',
      );

    const baseComponent = this.trainingPlanService.findComponentOrFail(
      baseTraining,
      ref.componentId,
    );

    const futureTrainings = await this.findAll(
      user,
      {
        groupId: baseTraining.groupId,
        cycleId: baseTraining.cycleId,
        from: baseTraining.to, // start from next training
      },
      { limit: 100 },
    );

    // target can be null / undefined, then just get the trainings without a target
    const filtered = futureTrainings.filter((t) => {
      const component = t.components.find((c) => c.id === ref.componentId);
      if (!component) return false;

      if (!baseComponent.target) return true; // no target, return all trainings with that component
      return component.target?.id === baseComponent.target.id;
    });

    // if no subgroup is selected, override all filtered trainings' components with the base component
    // if subgroup is selected, override only that subgroup
    for (const training of filtered) {
      // override component (supersets and if no subgroup selected also all subgroups) in future trainings
      this.trainingPlanService.copyOrOverrideComponent(
        ref,
        baseTraining,
        training,
        {
          overrideSupersets: true,
          overrideDirectSubgroups: !ref.subgroupId ? true : false,
          overrideOtherSubgroups: !ref.subgroupId ? true : false,
        },
      );

      if (ref.subgroupId)
        this.trainingPlanService.copyOrOverrideSubgroup(
          ref.subgroupId,
          baseComponent,
          training,
        );
    }

    filtered.unshift(baseTraining); // add base training to the beginning of the list

    const periodized = this.periodizationService.periodize(
      periodizationType,
      ref,
      filtered,
      exerciseIds,
      { createExerciseIfNotExistsInTrainings: true },
    );

    const operations: BatchUpdateOperation<Training>[] = periodized.map(
      (t) => ({
        operation: 'update',
        ref: this.repository.doc(t.id),
        data: this.firebaseService.buildUpdateQuery(t),
      }),
    );

    await this.firebaseService.paginateBatches(operations);
    return periodized.sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );
  }

  @LogMethod()
  async completeNextSet(
    user: User,
    ref: Pick<WorkloadRef, 'trainingId' | 'exerciseId' | 'userId'>,
    input: CompleteSetDto,
  ) {
    const { userId } = ref;
    const training = await this.findOneByIdOrFail(user, ref);
    const athlete = await this.getAthlete(user, userId, training.institution);

    const exercise = await this.exerciseService.findOneByIdOrFail(athlete, ref);
    this.workloadService.checkUnilateralInput(exercise.isUnilateral, input);

    if (
      !this.commonService.date.isBetween(
        training.from,
        startOfDay(new Date()),
        endOfDay(new Date()),
      )
    )
      throw new ConflictException('Training is not scheduled for today');

    const prescribedTraining = this.trainingPlanService.getTrainingByAthlete(
      athlete.uid,
      training,
    );

    await this.updateBodyweightSets(athlete.uid, prescribedTraining);
    await this.updateRepMaxSets(athlete.uid, prescribedTraining);

    const workload = await this.workloadService.completeNextSet(
      ref,
      prescribedTraining,
      input,
    );

    // update report
    await this.trainingReportService.updateReport(userId, training);
    return workload;
  }

  @LogMethod()
  async upsertSet(user: User, ref: WorkloadRef, input: CompleteSetDto) {
    const { userId } = ref;
    const training = await this.findOneByIdOrFail(user, ref);
    const athlete = await this.getAthlete(user, userId, training.institution);
    const exercise = await this.exerciseService.findOneByIdOrFail(athlete, ref);

    this.workloadService.checkUnilateralInput(exercise.isUnilateral, input);

    const prescribedTraining = this.trainingPlanService.getTrainingByAthlete(
      athlete.uid,
      training,
    );

    await this.updateBodyweightSets(athlete.uid, prescribedTraining);
    await this.updateRepMaxSets(athlete.uid, prescribedTraining);

    const workload = await this.workloadService.upsertSet(
      ref,
      prescribedTraining,
      input,
    );

    await this.trainingReportService.updateReport(userId, training);
    return workload;
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
      throw new ConflictException(
        'You cannot complete trainings that are not on the same day',
      );

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

    const report = await this.trainingReportService.findOneById({
      trainingId,
      userId: athlete.uid,
    });

    if (report) {
      const status = report.componentStatuses.find(
        (s) => s.componentId === componentId,
      );

      if (status && ['in_progress', 'completed'].includes(status.status))
        throw new ConflictException(
          this.firebaseService.isAthlete(user)
            ? `You have already completed this component`
            : `Athlete already completed this component`,
        );
    }

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
    const stats = this.trainingPlanService.recalculateCompletedTrainingStats(
      trainingComponent.id,
      training.stats,
      input.exercises,
    );

    // mark user as completed (for component and training)
    await this.trainingReportService.updateReport(athlete.uid, training);
    await this.repository.update(trainingId, { stats });
    return { ...training, stats };
  }

  @LogMethod()
  async getPrescribedTraining(user: User, ref: TrainingRef & UserRef) {
    const training = await this.findOneByIdOrFail(user, ref);
    const athlete = await this.getAthlete(user, ref.uid, training.institution);

    if (
      this.firebaseService.isTrainer(user) ||
      this.firebaseService.isManager(user)
    )
      this.validateCanView(user, training, training.institution);

    const athleteTraining = this.trainingPlanService.getTrainingByAthlete(
      athlete.uid,
      training,
    );

    // calculate param based sets
    await this.updateBodyweightSets(athlete.uid, athleteTraining);
    await this.updateRepMaxSets(athlete.uid, athleteTraining);

    const customPrescribedWorkloads =
      await this.workloadService.findAllCustomByTraining(training.id);

    const newPrescribedTrainingComponents: TrainingComponent[] = [];
    for (const trainingComponent of athleteTraining.components) {
      const newPrescribedSupersets: Superset[] = [];
      const prescribedSupersets = trainingComponent.supersets;

      prescribedSupersets.forEach(
        ({ exercises: prescribedExercises }, supersetIndex) => {
          const newPrescribedExercises: TrainingExercise[] = [];

          prescribedExercises.forEach((prescribedExercise) => {
            let newPrescribedSets: ExerciseSet[] = [];

            prescribedExercise.sets.forEach((prescribedSet) => {
              const customPrescribedWorkload = customPrescribedWorkloads.find(
                (w) =>
                  w.componentId === trainingComponent.id &&
                  w.exerciseId === prescribedExercise.id &&
                  w.supersetIndex === supersetIndex &&
                  w.setNumber === prescribedSet.setNumber &&
                  w.userId === athlete.uid,
              );

              const newPrescribedSet = customPrescribedWorkload
                ? this.workloadService.getExerciseSet(customPrescribedWorkload)
                : prescribedSet;

              newPrescribedSets.push(newPrescribedSet);
            });

            // sort sets by setNumber
            newPrescribedSets = newPrescribedSets.sort(
              (a, b) => a.setNumber - b.setNumber,
            );

            newPrescribedExercises.push({
              id: prescribedExercise.id,
              color: prescribedExercise.color,
              params: prescribedExercise.params,
              sets: newPrescribedSets,
            });
          });

          newPrescribedSupersets.push({
            color: trainingComponent.color,
            exercises: newPrescribedExercises,
          });
        },
      );

      newPrescribedTrainingComponents.push({
        id: trainingComponent.id,
        from: trainingComponent.from,
        to: trainingComponent.to,
        color: trainingComponent.color,
        copiedFrom: trainingComponent.copiedFrom,
        target: trainingComponent.target,
        methodId: trainingComponent.methodId,
        supersets: newPrescribedSupersets,
        subgroups: [],
        mainSet: trainingComponent.mainSet,
      });
    }

    return {
      ...training,
      components: newPrescribedTrainingComponents,
    };
  }

  async updateBodyweightSets(athleteId: string, training: Training) {
    const bwParam = { field: ParamType.IntWork1, selected: IntType.Bw };
    const hasBwParamType = this.trainingPlanService.hasParamType(
      training,
      bwParam,
    );

    if (!hasBwParamType) return;

    const ref = { uid: athleteId };
    const bw = await this.wellnessService.getLastBodyweight(ref);
    if (!bw || bw < MIN_BODYWEIGHT_KG) return; // no valid bodyweight found

    this.trainingPlanService.modifyPrescribedParamValuesByType(
      training,
      bwParam,
      (value) =>
        this.commonService.number.roundIntensity((value * bw) / 100, bw), // convert % value to kg and round to 2 decimals
    );
  }

  async updateRepMaxSets(athleteId: string, training: Training) {
    const rmParam = { field: ParamType.IntWork1, selected: IntType.Rm };
    const exercises = this.trainingPlanService.findExercisesByParamType(
      training,
      rmParam,
    );

    if (!exercises.length) return;

    const maxes: Workload[] = (
      await Promise.all(
        exercises.map((e) =>
          this.workloadRepository.findExerciseMax(athleteId, e.id),
        ),
      )
    ).filter(Boolean);

    this.trainingPlanService.modifyPrescribedParamValuesByType(
      training,
      rmParam,
      (value, exerciseId) => {
        // prescribed value is in % of 1RM (between 1 and 100)
        const best = maxes.find((max) => max.exerciseId === exerciseId);
        if (!best || !best.intWork1ValueL || !best.volWork1ValueL)
          return DEFAULT_WEIGHT_KG;

        const reps = best.volWork1ValueL;
        const weight = best.intWork1ValueL;
        const oneRM = this.commonService.number.rm(weight, reps);

        return this.commonService.number.roundIntensity(
          (value * oneRM) / 100,
          oneRM,
        );
      },
    );
  }

  @OnEvent(INSTITUTION_ATHLETE_EVENT, { async: true, promisify: true })
  async handleUpdateInstitutionAthleteEvent(
    event: UpdateInstitutionAthleteEvent,
  ) {
    // add or remove user from all future trainings of the institution
    const { operations, institutionId, groupId, userId, add } = event;
    const trainings = await this.repository.findAll((q) => {
      q = q.where('institutionId', '==', institutionId);
      if (groupId) q = q.where('groupId', '==', groupId);
      return q.where('from', '>=', Timestamp.fromDate(startOfDay(new Date())));
    });

    for (const training of trainings)
      operations.push(
        this.repository.getUpdateMemberOperation(training, userId, add),
      );
  }

  @OnEvent(DELETE_GROUP_EVENT, { async: true, promisify: true })
  async handleDeleteGroupEvent(event: DeleteGroupOrCycleEvent) {
    // delete all trainings of the group
    const { operations, groupId, cycleId } = event;
    const trainings = await this.repository.findAll((q) => {
      q = q.where('groupId', '==', groupId);
      if (cycleId) q = q.where('cycleId', '==', cycleId);
      return q;
    });

    for (const training of trainings)
      operations.push({
        operation: 'delete',
        ref: this.repository.doc(training.id),
      });
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

    const found = await this.authService.findOneBy('id', athleteId);
    if (!found) throw new NotFoundException('Athlete does not exist');

    if (institution)
      if (!this.institutionService.canView(found, institution))
        throw new UnauthorizedException(
          `Athlete ${found.displayName || found.email} cannot view institution ${institution.name}`,
        );

    return found;
  }

  private async validateOverlapAndMaxLimit(
    user: User,
    ref: CycleRef & Partial<TrainingRef>,
    from: Date,
    to: Date,
  ) {
    const trainings = (
      await this.findAll(
        user,
        {
          groupId: ref.groupId,
          cycleId: ref.cycleId,
          from: startOfDay(from),
          to: endOfDay(from),
        },
        { limit: MAX_NUM_TRAININGS_PER_DAY },
      )
    ).filter((t) => t.id !== ref.trainingId); // filter out the training being added/updated

    if (trainings.length > MAX_NUM_TRAININGS_PER_DAY - 1)
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

  private async validateOverlap(
    user: User,
    ref: CycleRef & Partial<TrainingRef>,
    from: Date,
    to: Date,
  ) {
    const trainings = (
      await this.findAll(
        user,
        {
          groupId: ref.groupId,
          cycleId: ref.cycleId,
          from: startOfDay(from),
          to: endOfDay(from),
        },
        { limit: MAX_NUM_TRAININGS_PER_DAY },
      )
    ).filter((t) => t.id !== ref.trainingId); // filter out the training being added/updated

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
