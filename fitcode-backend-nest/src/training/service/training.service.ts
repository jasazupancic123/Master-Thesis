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
  subDays,
} from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';

import { AuthService } from '@src/auth/service/auth.service';
import {
  DEFAULT_WEIGHT_KG,
  MIN_BODYWEIGHT_KG,
} from '@src/common/constant/weight.constant';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { UpdateMemberDto } from '@src/common/dto/user-id.dto';
import { Permission } from '@src/common/interface/permission.interface';
import { CommonService } from '@src/common/service/common.service';
import { Create, Update } from '@src/common/type/entity.type';
import { User } from '@src/common/type/firebase-auth.type';
import {
  CycleRef,
  SubgroupRef,
  TrainingComponentRef,
  TrainingComponentUserStatusRef,
  TrainingProtocolRef,
  TrainingRef,
  UserRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { BatchUpdateOperation } from '@src/common/type/orm.type';
import { Filter } from '@src/common/type/orm.type';
import { ValidateError } from '@src/common/type/validate.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { Components } from '@src/exercise/constant/components.constant';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';
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
import { PeriodizationService } from '@src/periodization/periodization.service';
import { WellnessService } from '@src/profile/service/wellness.service';
import { WorkloadService } from '@src/training/service/workload.service';

import {
  DURATION_TRAINING_COMPONENT_IN_MIN,
  MAX_NUM_TRAININGS_PER_DAY,
} from '../constant/training-limits.constant';
import {
  CreateTrainingComponentDto,
  CreateTrainingDto,
} from '../dto/create-training.dto';
import { PeriodizeTrainingsDto } from '../dto/periodize-training.dto';
import { Superset } from '../entity/superset.entity';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingComponentUserStatus } from '../entity/training-component-user-status.entity';
import { TrainingProtocol } from '../entity/training-protocol.entity';
import { CreateWorkload, Workload } from '../entity/workload.entity';
import { MainSet } from '../enum/main-set.enum';
import { TrainingStatus } from '../enum/training-status.enum';
import { UpdateTraining } from '../interface/update-training.interface';
import { TrainingRepository } from '../repository/training.repository';
import { TrainingComponentUserStatusRepository } from '../repository/training-component-user-status.repository';
import {
  GroupTrainingReportItem,
  TrainingReport,
  UserTrainingRealizationReportItem,
} from '../type/training-report.type';
import { TrainingPlanService } from './training-plan.service';
import { TrainingReportService } from './training-report.service';

@Injectable()
export class TrainingService implements Permission<Training, Institution> {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebase: FirebaseService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: Wrapper<AuthService>,
    private readonly common: CommonService,
    private readonly repository: TrainingRepository,
    private readonly trainingComponentUserStatusRepository: TrainingComponentUserStatusRepository,
    private readonly periodizationService: PeriodizationService,
    private readonly wellnessService: WellnessService,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadService: WorkloadService,
    private readonly groupService: GroupService,
    private readonly institutionService: InstitutionService,
    private readonly exerciseService: ExerciseService,
    private readonly exerciseParamService: ExerciseParamService,
    private readonly trainingReportService: TrainingReportService,
  ) {}

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
        training.institution = await this.institutionService.findById({
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
    institutionId: string,
    filter?: Filter<Training>,
    options?: { limit?: number },
    populate?: boolean,
  ): Promise<(Training & { statuses?: TrainingComponentUserStatus[] })[]> {
    const trainings = (await this.repository.findAll((_) =>
      this.repository.buildGetQuery(
        { uid: user.uid, role: this.firebase.getRole(user), institutionId },
        filter,
        options,
      ),
    )) as (Training & { statuses?: TrainingComponentUserStatus[] })[];

    // for today's trainings for athlete, also fetch statuses
    if (this.firebase.isAthlete(user)) {
      const statuses =
        await this.trainingComponentUserStatusRepository.getAllForUserToday(
          user.uid,
          { institutionId },
        );

      // map all statuses to corresponding training
      for (const training of trainings)
        training.statuses =
          statuses.filter((s) => s.trainingId === training.id) || [];
    }

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
            ? await this.institutionService.findById({
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

      const duration = this.common.number.round(performance.now() - start);

      this.logger.debug(`findAll(populate=true): Took ${duration}ms`);
    }

    return trainings;
  }

  async findReportsByUser(
    user: User,
    institutionId: string,
  ): Promise<TrainingReport[]> {
    // find workloads for last 10 trainings of the user and calculate reports
    const trainings = await this.findAll(
      user,
      institutionId,
      { from: subDays(new Date(), 7), to: endOfDay(new Date()) },
      { limit: 10 },
    );

    const workloads = await this.workloadService.findAllByUserTrainingIds(
      user.uid,
      trainings.map((t) => t.id),
    );

    const reports: TrainingReport[] = [];
    for (const training of trainings) {
      const filtered = workloads.filter(
        (w) => w.trainingId === training.id && w.userId === user.uid,
      );

      reports.push(
        this.trainingReportService.getTrainingReportByUser(
          user.uid,
          training,
          filtered,
        ),
      );
    }

    return reports;
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
    const inputComponents: TrainingComponent[] = input.components.map(
      (c, i) => ({
        mainSet: MainSet.BLOCK,
        supersets: [],
        subgroups: [],
        id: c.id,
        from: addMinutes(from, i * step),
        to: addMinutes(from, (i + 1) * step),
        targetId: c.targetId,
      }),
    );

    const to = inputComponents[inputComponents.length - 1].to;

    this.validateIsDateInCycle(from, cycle);
    this.validateIsDateInFuture(from);
    await this.validateOverlapAndMaxLimit(
      user,
      group?.institutionId,
      { groupId, cycleId, trainingId: null }, // no trainingId for new training
      from,
      to,
    );

    const membersIds = group ? group.membersIds : input.membersIds;

    this.trainingPlanService.validateTrainingComponents(
      inputComponents,
      membersIds,
      { exercises: [] },
    );

    const data: Create<Training> = {
      id: null,
      institutionId: group?.institutionId,
      groupId: group?.id,
      cycleId: input.cycleId,
      ownerId: user.uid,
      copiedFromId: input.copiedFromId || null,
      from,
      to,
      membersIds,
      components: inputComponents.map((c) => ({
        id: c.id,
        from: c.from,
        to: c.to,
        targetId: c.targetId,
        copiedFrom: c.copiedFrom,
        subgroups: [],
        supersets: [],
      })),
    };

    const id = await this.repository.save(data);
    return { ...data, id, createdAt: new Date(), updatedAt: new Date() };
  }

  @LogMethod()
  async createProtocol(
    user: User,
    institutionId: string,
    input: TrainingProtocol,
  ) {
    await this.institutionService.checkCanEditProtocols(user, institutionId);

    const exercises =
      await this.trainingPlanService.getAllTrainingExercisesBySupersets(
        input.supersets,
      );

    const supersets = this.trainingPlanService.validateSupersets(input, {
      exercises,
    });

    await this.institutionService.createTrainingProtocol(
      { institutionId },
      {
        id: null,
        institutionId,
        name: input.name,
        componentId: input.componentId,
        description: input.description,
        supersets,
      },
    );
  }

  @LogMethod()
  async updateProtocol(
    user: User,
    ref: TrainingProtocolRef,
    input: TrainingProtocol,
  ) {
    await this.institutionService.checkCanEditProtocols(
      user,
      ref.institutionId,
    );

    let supersets: Superset[];
    if (input.supersets) {
      const exercises =
        await this.trainingPlanService.getAllTrainingExercisesBySupersets(
          input.supersets,
        );

      supersets = this.trainingPlanService.validateSupersets(input, {
        exercises,
      });
    }

    await this.institutionService.updateTrainingProtocol(ref, {
      name: input.name,
      description: input.description,
      supersets,
    });
  }

  @LogMethod()
  async deleteProtocol(user: User, institutionId: string, protocolId: string) {
    await this.institutionService.checkCanEditProtocols(user, institutionId);
    await this.institutionService.deleteTrainingProtocol({
      institutionId,
      protocolId,
    });
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

    this.validateIsDateInFuture(training.from);

    // if no components, delete training
    if (input.components.length === 0) {
      await this.trainingComponentUserStatusRepository.deleteAllByTraining(
        ref.trainingId,
      );

      await this.repository.delete(ref.trainingId);
      return training;
    }

    // validate components & exercises
    const exercises = await this.trainingPlanService.getAllTrainingExercises(
      input.components,
    );

    const trainingComponents: TrainingComponent[] = this.trainingPlanService
      .validateTrainingComponents(input.components, training.membersIds, {
        exercises,
      })
      // override training times
      .map((c) => {
        const found = training.components.find((tc) => tc.id === c.id)!;
        return { ...c, from: found?.from, to: found?.to };
      });

    const updateTraining: Update<Training> = { components: trainingComponents };
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

    // validate
    this.validateCanEdit(user, training, training.institution);
    this.trainingPlanService.findComponentOrFail(training, ref.componentId);
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
      training.institutionId,
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
  async move(
    user: User,
    ref: TrainingRef,
    input: DateRangeDto,
  ): Promise<Training | null> {
    const training = await this.findOneByIdOrFail(user, ref);
    const _ref = {
      ...ref,
      institutionId: training.institutionId,
      groupId: training.groupId,
      cycleId: training.cycleId,
    };

    const group = await this.groupService.findOneByIdOrFail(user, _ref);
    const cycle = this.groupService.findCycleOrFail(training.cycleId, group);

    this.validateCanEdit(user, training, training.institution);
    this.validateIsDateInFuture(training.from);
    this.validateIsDateInFuture(input.from);
    this.validateIsDateInCycle(input.from, cycle);
    await this.validateOverlapAndMaxLimit(
      user,
      training.institutionId,
      _ref,
      input.from,
      input.to,
    );

    // delete statuses
    await this.trainingComponentUserStatusRepository.deleteAllByTraining(
      ref.trainingId,
    );

    if (training.components.length === 0) return null;

    // update training times
    const result = await this.repository.moveTraining(training, input);
    return {
      ...training,
      from: result.from,
      to: result.to,
      components: result.components,
    };
  }

  @LogMethod()
  async updateMembers(user: User, ref: TrainingRef, input: UpdateMemberDto) {
    const { userId: memberId, add } = input;

    // validate
    const training = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, training, training.institution))
      throw new UnauthorizedException('You are not allowed to update members');

    // check if member exists
    const member = await this.authService.findOneBy('id', memberId);
    if (!member) throw new BadRequestException('Member does not exist');
    if (!this.firebase.isAthlete(member))
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

    await this.trainingComponentUserStatusRepository.deleteAllByTraining(
      ref.trainingId,
    );

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
    const from = training.components[training.components.length - 1].to;
    const step = DURATION_TRAINING_COMPONENT_IN_MIN;

    const trainingComponents: TrainingComponent[] = [
      ...training.components,
      ...input.map((c, i) => ({
        ...c,
        id: c.id,
        from: addMinutes(from, i * step),
        to: addMinutes(from, (i + 1) * step),
        mainSet: MainSet.BLOCK,
        targetId: c.targetId,
        subgroups: [],
        supersets: [],
      })),
    ];

    const exercises =
      await this.trainingPlanService.getAllTrainingExercises(
        trainingComponents,
      );

    const validTrainingComponents = this.trainingPlanService
      .validateTrainingComponents(trainingComponents, training.membersIds, {
        exercises,
      })
      .map((c) => {
        const found = trainingComponents.find((tc) => tc.id === c.id)!;
        return { ...c, from: found.from, to: found.to };
      });

    const last = validTrainingComponents[validTrainingComponents.length - 1];
    const query: Update<Training> = {
      components: validTrainingComponents,
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
      await this.trainingComponentUserStatusRepository.deleteAllByTraining(
        ref.trainingId,
      );

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
      baseTraining.institutionId,
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

      if (!baseComponent.targetId) return true; // no target, return all trainings with that component
      return component.targetId === baseComponent.targetId;
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
        data: this.firebase.buildUpdateQuery(t),
      }),
    );

    await this.firebase.paginateBatches(operations);
    return periodized.sort(
      (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime(),
    );
  }

  @LogMethod()
  async completeNextSet(
    user: User,
    ref: Pick<WorkloadRef, 'trainingId' | 'exerciseId' | 'userId'>,
    input: CreateWorkload,
  ) {
    const { userId } = ref;
    const training = await this.findOneByIdOrFail(user, ref);
    const athlete = await this.getAthlete(user, userId, training.institution);
    const exercise = await this.exerciseService.findOneByIdOrFail(user, ref);

    const errors = this.exerciseParamService.validateSetValues(
      { ...input, setNumber: 1 },
      exercise,
    );

    if (errors.length) throw new BadRequestException(JSON.stringify(errors));

    if (
      !this.common.date.isBetween(
        training.from,
        startOfDay(new Date()),
        endOfDay(new Date()),
      )
    )
      throw new ConflictException('Training is not scheduled for today');

    const prescribedTraining = await this.getTrainingByAthlete(
      athlete.uid,
      training,
    );

    return await this.workloadService.completeNextSet(
      ref,
      prescribedTraining,
      input,
    );
  }

  @LogMethod()
  async upsertSet(user: User, ref: WorkloadRef, input: CreateWorkload) {
    const { userId } = ref;
    const training = await this.findOneByIdOrFail(user, ref);
    const athlete = await this.getAthlete(user, userId, training.institution);
    const exercise = await this.exerciseService.findOneByIdOrFail(user, ref);

    const errors = this.exerciseParamService.validateSetValues(
      { ...input, setNumber: ref.setNumber },
      exercise,
    );

    if (errors.length) throw new BadRequestException(JSON.stringify(errors));

    const individualTraining = await this.getTrainingByAthlete(
      athlete.uid,
      training,
    );

    return await this.workloadService.upsertSet(ref, individualTraining, input);
  }

  /**
   * This method will initialize training reports for specified users.
   * If the provided component has status NOT_STARTED or PAUSED, it will
   * put it into IN_PROGRESS mode.
   */
  @LogMethod()
  async startTrainingComponent(
    user: User,
    ref: TrainingComponentRef,
    uid?: string,
  ): Promise<{
    trainings: Record<string, Training>;
    errors: ValidateError<Record<string, unknown>>[];
  }> {
    const training = await this.findOneByIdOrFail(user, ref);
    this.checkComponentExists(training, ref.componentId);
    this.validateIsToday(training.from);

    const memberIds = await this.getMemberIdsForTrainingReport(
      user,
      training,
      uid,
    );

    // get individual training for each member
    const trainings = await this.findAllIndividual(training, memberIds); // <userId, training>
    const errors: ValidateError<Record<string, unknown>>[] = [];
    let input = memberIds.map((userId) => ({
      uid: userId,
      componentId: ref.componentId,
      training: trainings[userId],
    }));

    // check if any other training is already active
    for (const { uid } of input) {
      const activeTrainingId =
        await this.trainingComponentUserStatusRepository.getActiveTrainingId(
          uid,
        );

      if (activeTrainingId && activeTrainingId !== input[0].training.id) {
        errors.push({ field: uid, message: 'ACTIVE_TRAINING_EXISTS' });
        continue;
      }
    }

    // remove user ids from input that are in error state
    input = input.filter(({ uid }) => !errors.find((e) => e.field === uid));

    // if training report exists, then just update the correct component status to in_progress, else create new report
    for (const { uid, training, componentId } of input) {
      const ref: TrainingComponentUserStatusRef = {
        trainingId: training.id,
        componentId,
        uid,
      };

      let existing =
        await this.trainingComponentUserStatusRepository.findById(ref);

      if (existing) {
        if (existing.status === TrainingStatus.IN_PROGRESS) continue;
        if (existing.status === TrainingStatus.COMPLETED) {
          errors.push({ field: uid, message: 'COMPONENT_COMPLETED' });
          continue;
        }

        await this.trainingComponentUserStatusRepository.update(ref, {
          status: TrainingStatus.IN_PROGRESS,
        });
      } else
        await this.trainingComponentUserStatusRepository.save({
          id: null,
          from: new Date(),
          to: new Date(),
          institutionId: training.institutionId,
          groupId: training.groupId,
          cycleId: training.cycleId,
          trainingId: training.id,
          componentId,
          userId: uid,
          status: TrainingStatus.IN_PROGRESS,
          realization: 0,
          reps: 0,
          dist: 0,
          time: 0,
          exercises: 0,
          sets: 0,
          tonnage: 0,
          tut: 0,
          recTime: 0,
          recDist: 0,
        });
    }

    return { trainings, errors };
  }

  /**
   * Completes training component for specified users. It only finalizes
   * components that are in IN_PROGRESS or PAUSED status.
   */
  @LogMethod()
  async completeTrainingComponent(
    user: User,
    ref: TrainingComponentRef,
    uid?: string,
  ): Promise<{
    errors: ValidateError<Record<string, unknown>>[];
  }> {
    const training = await this.findOneByIdOrFail(user, ref);
    this.checkComponentExists(training, ref.componentId);

    // finalize training reports
    const memberIds = await this.getMemberIdsForTrainingReport(
      user,
      training,
      uid,
    );

    const workloads = await this.workloadService.findAllByUserTraining({
      trainingId: training.id,
    });

    const errors: ValidateError<Record<string, unknown>>[] = [];
    for (const userId of memberIds) {
      const statusRef: TrainingComponentUserStatusRef = { ...ref, uid: userId };
      const status =
        await this.trainingComponentUserStatusRepository.findById(statusRef);

      if (!status || status.status === TrainingStatus.NOT_STARTED) {
        errors.push({ field: userId, message: 'COMPONENT_NOT_STARTED' });
        continue;
      }

      if (status.status === TrainingStatus.COMPLETED) {
        errors.push({ field: userId, message: 'COMPONENT_COMPLETED' });
        continue;
      }

      const report = this.trainingReportService.getTrainingComponentReport(
        userId,
        ref.componentId,
        training,
        workloads.filter((w) => w.userId === userId),
      );

      await this.trainingComponentUserStatusRepository.update(statusRef, {
        status: TrainingStatus.COMPLETED,
        realization: report.realization,
        sets: report.sets,
        reps: report.reps,
        dist: report.dist,
        time: report.time,
        recTime: report.recTime,
        recDist: report.recDist,
        exercises: report.exercises,
        tonnage: report.tonnage,
        tut: report.tut,
      });
    }

    return { errors };
  }

  /**
   * Pauses training component. Only components that are in IN_PROGRESS status
   * can be paused. Note that trainer will not be able to pause training reports
   * for all athletes. He cannot pause training at all, only athlete can for himself.
   */
  @LogMethod()
  async pauseComponent(user: User, ref: TrainingComponentRef): Promise<void> {
    const training = await this.findOneByIdOrFail(user, ref);
    this.checkComponentExists(training, ref.componentId);
    this.validateIsToday(training.from);

    const statusRef: TrainingComponentUserStatusRef = { ...ref, uid: user.uid };
    const status =
      await this.trainingComponentUserStatusRepository.findById(statusRef);

    if (!status)
      throw new BadRequestException('Training component not started');

    // can only pause component that is in IN_PROGRESS status
    if (status.status !== TrainingStatus.IN_PROGRESS)
      throw new BadRequestException(
        'You can only pause training that is currently in progress',
      );

    await this.trainingComponentUserStatusRepository.update(statusRef, {
      status: TrainingStatus.PAUSED,
    });
  }

  @LogMethod()
  async getGroupReport(
    user: User,
    groupId: string,
    componentId?: string,
  ): Promise<Record<string, GroupTrainingReportItem>> {
    const group = await this.groupService.findOneByIdOrFail(user, { groupId });
    return await this.trainingComponentUserStatusRepository.getGroupReport(
      group.id,
      componentId,
    );
  }

  @LogMethod()
  async getTrainingsRealizationReport(
    user: User,
    institutionId: string,
    uid: string, // athlete uid
    componentId?: string,
  ): Promise<UserTrainingRealizationReportItem[]> {
    const institution = await this.institutionService.findByIdOrFail({
      institutionId,
    });

    const athlete = await this.getAthlete(user, uid, institution);
    return await this.trainingComponentUserStatusRepository.getUserTrainingsRealizationReport(
      institutionId,
      athlete.uid,
      componentId,
    );
  }

  @LogMethod()
  async getUserExerciseReport(
    user: User,
    institutionId: string,
    exerciseId: string,
    uid: string, // athlete uid
  ): Promise<Workload[]> {
    const institution = await this.institutionService.findByIdOrFail({
      institutionId,
    });

    const athlete = await this.getAthlete(user, uid, institution);
    return await this.workloadService.getUserExerciseReport({
      userId: athlete.uid,
      exerciseId,
    });
  }

  private async getMemberIdsForTrainingReport(
    user: User, // trainer or athlete
    training: Training,
    uid?: string, // trainer can also provide only 1 athlete
  ): Promise<string[]> {
    // initialize training reports
    //   - if user is manager/trainer, then for all members OR for the specified athlete
    //   - if user is athlete, then only for himself

    if (this.firebase.isTrainer(user) || this.firebase.isManager(user)) {
      if (uid) {
        const athlete = await this.getAthlete(user, uid, training.institution);
        return [athlete.uid];
      }

      return training.membersIds;
    }

    return [user.uid];
  }

  async generateQRCode(
    user: User,
    ref: TrainingComponentRef & UserRef,
  ): Promise<string> {
    const athlete = await this.getAthlete(user, ref.uid);
    const { trainings } = await this.startTrainingComponent(
      athlete,
      ref,
      ref.uid,
    );

    const training = trainings[athlete.uid];
    return await this.authService.createMagicLink(
      user,
      athlete.uid,
      `/trainings/${training.id}/components/${ref.componentId}`,
    );
  }

  /**
   * Special method for trainers and managers, for a prescribed training it
   * will fetch individualized trainings for each athlete. So, if training
   * has 20 members, it will return 20 trainings with individualized parameters.
   */
  async findAllIndividual(
    training: Training,
    memberIds: string[],
  ): Promise<Record<string, Training>> {
    return await Object.fromEntries(
      await Promise.all(
        memberIds.map(async (userId) => {
          const t = await this.getTrainingByAthlete(userId, training);
          return [userId, t];
        }),
      ),
    );
  }

  /**
   * Returns all trainings that are currently in progress for today.
   * Each user can only have one active training at a time. If `user`
   * is athlete, only 1 training is returned. If user is coach, 1
   * training for each of the athletes is returned.
   */
  async getActiveTrainingByAthlete(
    user: User,
    athleteId: string,
  ): Promise<
    | (Training & {
        workloads: Workload[];
        statuses: TrainingComponentUserStatus[];
      })
    | null
  > {
    const athlete = await this.getAthlete(user, athleteId);
    const trainingId =
      await this.trainingComponentUserStatusRepository.getActiveTrainingId(
        athlete.uid,
      );

    if (!trainingId) return null;

    const training = await this.findOneByIdOrFail(user, { trainingId });
    const individualTraining = await this.getTrainingByAthlete(
      athlete.uid,
      training,
    );

    const statuses =
      await this.trainingComponentUserStatusRepository.findAllByUserTraining(
        athlete.uid,
        trainingId,
      );

    return { ...individualTraining, statuses };
  }

  async getTrainingByAthlete(
    athleteId: string,
    training: Training,
  ): Promise<Training & { workloads: Workload[] }> {
    const athleteTraining = this.trainingPlanService.getTrainingByAthlete(
      athleteId,
      training,
    );

    // calculate param based sets
    let workloads: Workload[] = [];
    try {
      await this.updateBodyweightSets(athleteId, athleteTraining);
      await this.updateRepMaxSets(athleteId, athleteTraining);
      workloads = await this.updateTrainingWithWorkloads(
        athleteId,
        athleteTraining,
      );
    } catch (e) {
      this.logger.error(e);
    }

    return { ...athleteTraining, workloads };
  }

  async updateBodyweightSets(athleteId: string, training: Training) {
    const hasBwParamType = this.trainingPlanService.hasLoadType(
      training,
      'loadBw',
    );

    if (!hasBwParamType) return;

    const ref = { uid: athleteId };
    const bw = await this.wellnessService.getLastBodyweight(ref);
    if (!bw || bw < MIN_BODYWEIGHT_KG) return; // no valid bodyweight found

    this.trainingPlanService.modifyPrescribedParamValuesByType(
      training,
      'loadBw',
      (value) => this.common.number.roundIntensity((value * bw) / 100, bw), // convert % value to kg and round to 2 decimals
    );
  }

  async updateRepMaxSets(athleteId: string, training: Training) {
    const exercises = this.trainingPlanService.findExercisesByLoadType(
      training,
      'loadRm',
    );

    if (!exercises.length) return;

    const maxes: Workload[] = (
      await Promise.all(
        exercises.map((e) =>
          this.workloadService.findExerciseMax(athleteId, e.id),
        ),
      )
    ).filter(Boolean);

    this.trainingPlanService.modifyPrescribedParamValuesByType(
      training,
      'loadRm',
      (value, exerciseId) => {
        // prescribed value is in % of 1RM (between 1 and 100)
        const best = maxes.find((max) => max.exerciseId === exerciseId);
        if (!best || !best.loadKg || !best.reps) return DEFAULT_WEIGHT_KG;

        const oneRM = this.common.number.rm(best.loadKg, best.reps);
        return this.common.number.roundIntensity((value * oneRM) / 100, oneRM);
      },
    );
  }

  async updateTrainingWithWorkloads(
    athleteId: string,
    training: Training,
  ): Promise<Workload[]> {
    const workloads = await this.workloadService.findAllByUserTraining({
      userId: athleteId,
      trainingId: training.id,
    });

    if (workloads.length)
      this.trainingPlanService.applyWorkloadsToTraining(training, workloads);

    return workloads;
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

  private checkComponentExists(
    training: Training,
    componentId: string,
  ): TrainingComponent {
    const component = training.components.find((c) => c.id === componentId);
    if (!component) {
      const name =
        Components.find((c) => c.field === componentId)?.name || 'Component';
      throw new NotFoundException(`${name} not found`);
    }

    return component;
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
    if (this.firebase.isAthlete(user)) return user;
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
    institutionId: string,
    ref: CycleRef & Partial<TrainingRef>,
    from: Date,
    to: Date,
  ) {
    const trainings = (
      await this.findAll(
        user,
        institutionId,
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
      this.common.date.doRangesOverlap(from, to, training.from, training.to),
    );

    if (isOverlap)
      throw new BadRequestException('Training overlaps with other training');
  }

  private async validateOverlap(
    user: User,
    institutionId: string,
    ref: CycleRef & Partial<TrainingRef>,
    from: Date,
    to: Date,
  ) {
    const trainings = (
      await this.findAll(
        user,
        institutionId,
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
      this.common.date.doRangesOverlap(from, to, training.from, training.to),
    );

    if (isOverlap)
      throw new BadRequestException('Training overlaps with other training');
  }

  private validateIsDateInCycle(from: Date, cycle: Cycle) {
    if (!this.common.date.isBetween(from, cycle.from, cycle.to))
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

  validateIsToday(date: Date) {
    if (!isSameDay(date, new Date()))
      throw new BadRequestException('Training is not scheduled for today');
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
      if (
        institution.athleteIds.includes(user.uid) &&
        training.membersIds.includes(user.uid)
      )
        return true;
    }

    return false;
  }

  canEdit(user: User, training: Training, institution?: Institution) {
    if (this.firebase.isTrainer(user) && training.ownerId === user.uid)
      return true;

    if (institution) {
      if (this.firebase.isManager(user) && institution.ownerId === user.uid)
        return true;

      if (
        this.firebase.isTrainer(user) &&
        institution.trainerIds.includes(user.uid)
      )
        return true;
    }

    return false;
  }

  canAdd(user: User, institution?: Institution) {
    if (this.firebase.isTrainer(user)) return true;

    if (institution) {
      if (this.firebase.isManager(user) && institution.ownerId === user.uid)
        return true;

      if (
        this.firebase.isTrainer(user) &&
        institution.trainerIds.includes(user.uid)
      )
        return true;
    }

    return false;
  }
}
