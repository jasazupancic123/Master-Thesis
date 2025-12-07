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
  TrainingRef,
  UserRef,
  WorkloadRef,
} from '@src/common/type/firestore.type';
import { BatchUpdateOperation } from '@src/common/type/orm.type';
import { Filter } from '@src/common/type/orm.type';
import { ValidateError } from '@src/common/type/validate.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { ExerciseParamService } from '@src/exercise/service/exercise-param.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { DELETE_GROUP_EVENT } from '@src/institution/constant/delete-group-event.constant';
import { INSTITUTION_ATHLETE_EVENT } from '@src/institution/constant/update-institution-athlete-event.constant';
import { Cycle } from '@src/institution/entity/cycle.entity';
import { Group } from '@src/institution/entity/group.entity';
import { Institution } from '@src/institution/entity/institution.entity';
import { DeleteGroupOrCycleEvent } from '@src/institution/event/delete-group.event';
import { UpdateInstitutionAthleteEvent } from '@src/institution/event/update-institution-athlete.event';
import { GroupService } from '@src/institution/service/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { PeriodizationService } from '@src/periodization/periodization.service';
import { ProfileService } from '@src/profile/service/profile.service';
import { WorkloadService } from '@src/training/service/workload.service';

import {
  DURATION_TRAINING_COMPONENT_IN_MIN,
  MAX_NUM_TRAININGS_PER_DAY,
} from '../constant/training-limits.constant';
import { CreateTrainingDto } from '../dto/create-training.dto';
import { PeriodizeTrainingsDto } from '../dto/periodize-training.dto';
import {
  TrainingAction,
  TrainingActionPayload,
  TrainingActionRef,
} from '../dto/training-action.dto';
import { UpdateManyWorkloadsDto } from '../dto/update-many-workloads.dto';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingComponentUserStatus } from '../entity/training-component-user-status.entity';
import {
  CreateWorkload,
  ImportWorkloadDto,
  Workload,
} from '../entity/workload.entity';
import { MainSet } from '../enum/main-set.enum';
import { SetStatus } from '../enum/set-status.enum';
import { TrainingStatus } from '../enum/training-status.enum';
import { UpdateTraining } from '../interface/update-training.interface';
import { TrainingRepository } from '../repository/training.repository';
import { TrainingComponentUserStatusRepository } from '../repository/training-component-user-status.repository';
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
    private readonly profileService: ProfileService,
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
        training.institution = await this.institutionService.findById(
          user,
          training.institutionId,
        );

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
    let trainings = (await this.repository.findAll((_) =>
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

      trainings = await Promise.all(
        trainings.map((t) =>
          this.populateTraining(t, user, { institutions, groups }),
        ),
      );

      const duration = this.common.number.round(performance.now() - start);

      this.logger.debug(`findAll(populate=true): Took ${duration}ms`);
    }

    return trainings;
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
  async createForInstitution(
    user: User,
    input: CreateTrainingDto,
  ): Promise<Training> {
    // validate parent references
    const { institutionId, groupId, cycleId } = input;
    const institution = await this.institutionService.findByIdOrFail(
      user,
      institutionId,
    );

    let group: Group | null = null;
    let cycle: Cycle | null = null;

    if (groupId) {
      group = await this.groupService.findOneByIdOrFail(user, {
        institutionId,
        groupId,
      });

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
        supersets: c.supersets || [],
        subgroups: c.subgroups || [],
        id: c.id,
        from: addMinutes(from, i * step),
        to: addMinutes(from, (i + 1) * step),
        targetId: c.targetId,
      }),
    );

    const to = inputComponents[inputComponents.length - 1].to;

    if (cycle) this.validateIsDateInCycle(from, cycle);
    this.validateIsDateInFuture(from);

    await this.validateOverlapAndMaxLimit(
      user,
      institutionId,
      { groupId, cycleId, trainingId: null }, // no trainingId for new training
      from,
      to,
    );

    const membersIds = this.firebase.isAthlete(user)
      ? [user.uid]
      : group
        ? group.membersIds
        : input.membersIds;

    const exercises = await this.exerciseService.findAll(user, institutionId);

    this.trainingPlanService.validateTrainingComponents(
      inputComponents,
      membersIds,
      { exercises },
    );

    const data: Create<Training> = {
      id: null,
      institutionId: institution.id,
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
        supersets: c.supersets || [],
        subgroups: c.subgroups || [],
      })),
    };

    const id = await this.repository.save(data);

    const institutions: Institution[] = [];
    const groups: Group[] = [];

    return await this.populateTraining(
      { ...data, id, createdAt: new Date(), updatedAt: new Date() },
      user,
      { institutions, groups },
    );
  }

  @LogMethod()
  async update(
    user: User,
    ref: TrainingRef,
    input: UpdateTraining,
  ): Promise<Training> {
    // validate training
    const training = await this.findOneByIdOrFail(user, ref);
    const { institutionId, groupId, cycleId } = training;
    if (groupId && cycleId) {
      await this.groupService.findOneByIdOrFail(user, {
        institutionId,
        groupId,
      });

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
    if (!training.institution!.members.some((m) => m.id === member.uid))
      throw new BadRequestException('Member is not part of the institution');

    // update members
    if (add) await this.repository.addMember(training, member.uid);
    else await this.repository.removeMember(training, member.uid);

    // remove training component statuses for this member for this training
    await this.trainingComponentUserStatusRepository.deleteAllByTrainingByMember(
      training.id,
      member.uid,
    );
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
    input: TrainingComponent[],
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
        subgroups: c.subgroups || [],
        supersets: c.supersets || [],
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
  async modifyTraining(
    user: User,
    trainingId: string,
    action: TrainingAction,
    ref: TrainingActionRef,
    payload: TrainingActionPayload,
  ): Promise<Training> {
    const training = await this.findOneByIdOrFail(user, { trainingId });

    if (training.institutionId) {
      if (this.firebase.isAthlete(user))
        ref.userId = user.uid; // athlete can only modify their own training
      else this.validateCanEdit(user, training, training.institution);
    }

    // validate exercise if provided
    if (ref.exerciseId) {
      const exercise = await this.exerciseService.findByIdOrFail(
        ref.exerciseId,
      );

      if (!this.exerciseService.canView(user, exercise, training.institution))
        throw new BadRequestException('Invalid exercise');
    }

    this.validateIsDateInFuture(training.from);

    let updated = training;
    if (this.firebase.isAthlete(user)) {
      if (!ref.componentId)
        throw new BadRequestException('You must provide componentId');

      // athlete modifies prescribed training, needs to be moved to a subgroup
      updated = this.trainingPlanService.moveUserToVirtualSubgroup(
        training,
        ref.componentId,
        ref.userId,
      );

      ref.subgroupId = ref.userId; // user has been moved to virtual subgroup named by their userId
    }

    const { components } = this.applyTrainingAction(
      updated,
      action,
      ref,
      payload,
    );

    await this.repository.update(training.id, { components });

    return { ...training, components };
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

    this.logger.log('Completing next set for workload', {
      trainingId: training.id,
      athlete: athlete.email,
      exerciseId: exercise.id,
      errors: errors,
    });

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

  @LogMethod()
  async importWorkloads(
    user: User,
    workloads: ImportWorkloadDto[],
  ): Promise<Training> {
    const COMPONENT_ID = 'strength';
    const institution = await this.institutionService.findByOwnerId(user.uid);
    if (!institution) throw new NotFoundException('Institution not found');

    // check that all exercises are valid
    const exercises = await this.exerciseService.findAll(user, institution.id);
    const input: Workload[] = [];

    for (let i = 0; i < workloads.length; i++) {
      const workload = workloads[i];

      // validate user
      const user = await this.authService.findOneBy('email', workload.email);
      if (!user) throw new NotFoundException(`Row ${i + 1}: User not found`);

      if (!this.institutionService.canView(user, institution))
        throw new UnauthorizedException(
          `Row ${i + 1}: User is not authorized to view this institution`,
        );

      if (!this.firebase.isAthlete(user))
        throw new BadRequestException(`Row ${i + 1}: User is not an athlete`);

      // validate that date is in the past
      if (!this.isInPast(startOfDay(workload.date)))
        throw new BadRequestException(`Row ${i + 1}: Date must be in the past`);

      // validate exercise
      const exercise = exercises.find((e) => e.id === workload.exerciseId);
      if (!exercise)
        throw new BadRequestException(`Row ${i + 1}: Invalid exerciseId`);

      const setErrors = this.exerciseParamService.validateSetValues(
        workload,
        exercise,
      );

      const message = setErrors.length
        ? this.common.generic.error(
            setErrors.map((e) => ({
              field: e.field,
              message: `Row ${i + 1}: ${e.message}`,
            })),
          )
        : '';

      if (message)
        throw new BadRequestException(`Set errors in row ${i + 1}: ${message}`);

      input.push({
        ...workload,
        id: null,
        institutionId: institution.id,
        groupId: undefined,
        cycleId: undefined,
        userId: user.uid,
        trainingId: undefined,
        componentId: COMPONENT_ID,
        supersetIndex: 0,
        status: SetStatus.COMPLETED,
        from: workload.date,
        to: workload.date,
        prescribed: workload,
      });
    }

    // create dummy training to link workloads to
    const trainingId = await this.repository.save({
      id: null,
      ownerId: user.uid,
      institutionId: institution.id,
      from: new Date(),
      to: new Date(),
      membersIds: [],
      components: [
        {
          id: COMPONENT_ID,
          from: new Date(),
          to: new Date(),
          supersets: [],
          subgroups: [],
        },
      ],
    });

    await this.workloadService.upsertMany(
      input.map((w) => ({ ...w, trainingId })),
    );

    return await this.findOneByIdOrFail(user, { trainingId });
  }

  @LogMethod()
  async updateManyWorkloads(
    user: User,
    trainingId: string,
    input: UpdateManyWorkloadsDto,
  ): Promise<void> {
    const training = await this.findOneByIdOrFail(user, { trainingId });
    if (
      !this.institutionService.canEditExtended(user, training.institution, {
        allowTrainer: true,
        allowAthlete: true,
      })
    )
      throw new UnauthorizedException(
        'You are not authorized to edit this training',
      );

    const workloads = await this.workloadService.findAllByUserTraining({
      institutionId: training.institutionId,
      trainingId,
      ...(this.firebase.isAthlete(user) && { userId: user.uid }),
    });

    // check that all provided updates/deletes exist
    const errors: ValidateError<Workload>[] = [];
    const refs = [...input.updates.map((u) => u.ref), ...input.deletes];

    for (const ref of refs) {
      const found = workloads.find(
        (w) =>
          w.trainingId === ref.trainingId &&
          w.componentId === ref.componentId &&
          w.supersetIndex === ref.supersetIndex &&
          w.exerciseId === ref.exerciseId &&
          w.userId === ref.userId &&
          w.setNumber === ref.setNumber,
      );

      if (!found)
        errors.push({
          field: 'id',
          message: `NOT_FOUND: ${JSON.stringify(ref)}`,
        });
    }

    if (errors.length)
      throw new BadRequestException(this.common.generic.error(errors));

    await this.workloadService.updateMany(input.updates, input.deletes);

    // recalculate all component statuses
    const newWorkloads = await this.workloadService.findAllByUserTraining({
      institutionId: training.institutionId,
      trainingId,
      ...(this.firebase.isAthlete(user) && { userId: user.uid }),
    });

    const memberIds = Array.from(new Set(newWorkloads.map((w) => w.userId)));
    await Promise.all(
      memberIds.map(async (memberId) => {
        const memberWorkloads = newWorkloads.filter(
          (w) => w.userId === memberId,
        );

        const componentIds = Array.from(
          new Set(memberWorkloads.map((w) => w.componentId)),
        );

        return Promise.all(
          componentIds.map((componentId) => {
            return this.upsertTrainingComponentStatus(
              training,
              { uid: memberId, trainingId: training.id, componentId },
              memberWorkloads,
            );
          }),
        );
      }),
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

  async getTrainingByAthlete(
    athleteId: string,
    training: Training,
  ): Promise<Training> {
    const athleteTraining = this.trainingPlanService.getTrainingByAthlete(
      athleteId,
      training,
    );

    // calculate param based sets
    try {
      await this.updateBodyweightSets(athleteId, athleteTraining);
      await this.updateRepMaxSets(athleteId, athleteTraining);
    } catch (e) {
      this.logger.error(e);
    }

    return athleteTraining;
  }

  async updateBodyweightSets(athleteId: string, training: Training) {
    const hasBwParamType = this.trainingPlanService.hasLoadType(
      training,
      'loadBw',
    );

    if (!hasBwParamType) return;

    const profile = await this.profileService.findOneById(athleteId);
    if (!profile) return;

    const bw = profile.wellness.weight;
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

  async upsertTrainingComponentStatus(
    training: Training,
    ref: TrainingComponentUserStatusRef,
    workloads: Workload[],
  ): Promise<void> {
    workloads = workloads
      .filter(
        (w) =>
          w.trainingId === ref.trainingId &&
          w.userId === ref.uid &&
          w.componentId === ref.componentId,
      )
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

    const report = this.trainingReportService.getTrainingComponentReport(
      ref.uid,
      ref.componentId,
      training,
      workloads,
    );

    const existing =
      await this.trainingComponentUserStatusRepository.findById(ref);

    const from = workloads[0]?.from ? new Date(workloads[0]?.from) : new Date();
    const to = workloads[workloads.length - 1]?.to
      ? new Date(workloads[workloads.length - 1]?.to)
      : new Date();

    if (existing) {
      await this.trainingComponentUserStatusRepository.update(ref, {
        from,
        to,
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
    } else {
      await this.trainingComponentUserStatusRepository.save({
        id: null,
        from,
        to,
        institutionId: training.institutionId,
        groupId: training.groupId,
        cycleId: training.cycleId,
        trainingId: training.id,
        componentId: ref.componentId,
        userId: ref.uid,
        status: TrainingStatus.NOT_STARTED,
        realization: report.realization,
        sets: report.sets,
        reps: report.reps,
        dist: report.dist,
        time: report.time,
        exercises: report.exercises,
        tonnage: report.tonnage,
        tut: report.tut,
        recTime: report.recTime,
        recDist: report.recDist,
      });
    }
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
  async getAthlete(user: User, athleteId: string, institution?: Institution) {
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

  private async populateTraining(
    training: Training,
    user: User,
    options?: {
      institutions?: Institution[];
      groups?: Group[];
    },
  ): Promise<Training> {
    const { institutions = [], groups = [] } = options || {
      institutions: [],
      groups: [],
    };

    const foundInstitution = institutions.find(
      (i) => i.id === training.institutionId,
    );

    const institution =
      foundInstitution || training.institutionId
        ? await this.institutionService.findById(user, training.institutionId)
        : undefined;

    const foundGroup = groups.find((g) => g.id === training.groupId);
    const group =
      foundGroup || training.groupId
        ? await this.groupService.findOneById(user, {
            groupId: training.groupId,
            institutionId: institution?.id!,
          })
        : undefined;

    if (!foundInstitution && institution) institutions.push(institution);
    if (!foundGroup && group) groups.push(group);

    training.institution = institution;
    training.group = group;

    if (group)
      training.cycle = this.groupService.findCycleOrFail(
        training.cycleId,
        training.group,
      );

    return training;
  }

  private async validateOverlapAndMaxLimit(
    user: User,
    institutionId: string,
    ref: Omit<CycleRef & Partial<TrainingRef>, 'institutionId'>,
    from: Date,
    to: Date,
  ) {
    const trainings = (
      await this.findAll(
        user,
        institutionId,
        {
          ...(ref.groupId && { groupId: ref.groupId }),
          ...(ref.cycleId && { cycleId: ref.cycleId }),
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
    ref: Omit<CycleRef & Partial<TrainingRef>, 'institutionId'>,
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

  private applyTrainingAction(
    training: Training,
    action: TrainingAction,
    ref: TrainingActionRef,
    payload: TrainingActionPayload,
  ): Update<Training> {
    switch (action) {
      case TrainingAction.ADD_SUPERSET:
        return this.addSuperset(training, ref);
      case TrainingAction.REMOVE_SUPERSET:
        return this.removeSuperset(training, ref);
      case TrainingAction.ADD_EXERCISE:
        return this.addExercise(training, ref);
      case TrainingAction.REMOVE_EXERCISE:
        return this.removeExercise(training, ref);
      case TrainingAction.ADD_SET:
        return this.addSet(training, ref, payload);
      case TrainingAction.UPDATE_SET:
        return this.updateSet(training, ref, payload);
      case TrainingAction.REMOVE_SET:
        return this.removeSet(training, ref);
      default:
        throw new BadRequestException(`Action ${action} not supported yet`);
    }
  }

  private addSuperset(training: Training, ref: TrainingActionRef) {
    const component = this.trainingPlanService.findComponentOrFail(
      training,
      ref.componentId,
    );

    const item = ref.subgroupId
      ? this.trainingPlanService.findSubgroupOrFail(component, ref.subgroupId)
      : component;

    // check if superset limit is reached
    this.trainingPlanService.validateSupersetLimit(item);

    item.supersets = [
      ...item.supersets,
      { mainSet: MainSet.BLOCK, exercises: [] },
    ];

    return training;
  }

  private removeSuperset(training: Training, ref: TrainingActionRef) {
    const { supersetIndex } = ref;
    if (supersetIndex === undefined)
      throw new BadRequestException(
        'Superset index is required to remove superset',
      );

    const component = this.trainingPlanService.findComponentOrFail(
      training,
      ref.componentId,
    );

    const item = ref.subgroupId
      ? this.trainingPlanService.findSubgroupOrFail(component, ref.subgroupId)
      : component;

    if (supersetIndex < 0 || supersetIndex >= component.supersets.length)
      throw new NotFoundException('Superset not found in component');

    item.supersets.splice(supersetIndex, 1);
    return training;
  }

  private addExercise(training: Training, ref: TrainingActionRef) {
    const { superset } =
      this.trainingPlanService.validateTrainingActionSupersetRef(training, ref);

    // if exercise already exists in superset, throw error
    const exists = superset.exercises.find((e) => e.id === ref.exerciseId);
    if (exists)
      throw new BadRequestException('Exercise already exists in superset');

    superset.exercises = [
      ...superset.exercises,
      { id: ref.exerciseId, sets: [] },
    ];

    return training;
  }

  private removeExercise(training: Training, ref: TrainingActionRef) {
    const { superset, exerciseIndex } =
      this.trainingPlanService.validateTrainingActionExerciseRef(training, ref);

    superset.exercises.splice(exerciseIndex, 1);
    return training;
  }

  private addSet(
    training: Training,
    ref: TrainingActionRef,
    payload: TrainingActionPayload,
  ) {
    if (!payload.set) throw new BadRequestException('Set payload is required');

    const { exercise } =
      this.trainingPlanService.validateTrainingActionExerciseRef(training, ref);

    exercise.sets.push(payload.set); // add set
    exercise.sets = exercise.sets.map((s, i) => ({ ...s, setNumber: i + 1 })); // update set numbers

    return training;
  }

  private updateSet(
    training: Training,
    ref: TrainingActionRef,
    payload: TrainingActionPayload,
  ) {
    if (!payload.set) throw new BadRequestException('Set payload is required');

    const { exercise } =
      this.trainingPlanService.validateTrainingActionExerciseRef(training, ref);

    const { setNumber } = ref;
    if (setNumber === undefined)
      throw new BadRequestException('Set number is required to update a set');

    if (setNumber < 1 || setNumber > exercise.sets.length)
      throw new NotFoundException('Set not found in exercise');

    exercise.sets[setNumber - 1] = {
      ...exercise.sets[setNumber - 1],
      ...payload.set,
      setNumber,
    };

    return training;
  }

  private removeSet(training: Training, ref: TrainingActionRef) {
    const { exercise } =
      this.trainingPlanService.validateTrainingActionExerciseRef(training, ref);

    const { setNumber } = ref;
    if (setNumber === undefined)
      throw new BadRequestException(
        'componentId, supersetIndex, exerciseId and setIndex required',
      );

    if (setNumber < 1 || setNumber > exercise.sets.length)
      throw new NotFoundException('Set not found in exercise');

    exercise.sets.splice(setNumber - 1, 1); // remove set
    exercise.sets = exercise.sets.map((s, i) => ({ ...s, setNumber: i + 1 })); // update set numbers

    return training;
  }

  private validateIsDateInCycle(from: Date, cycle: Cycle) {
    if (!this.common.date.isBetween(from, cycle.from, cycle.to))
      throw new BadRequestException(
        'Training falls outside of the selected cycle',
      );
  }

  private validateIsDateInFuture(
    _from: Date,
    _relativeDate = startOfDay(new Date()),
  ) {
    /* if (this.isInPast(from, relativeDate))
      throw new BadRequestException(
        'You cannot add or update trainings in the past',
      ); */
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
      const trainerIds = this.institutionService
        .getTrainers(institution)
        .map((m) => m.id);

      const athleteIds = this.institutionService
        .getAthletes(institution)
        .map((m) => m.id);

      if (institution.ownerId === user.uid) return true;
      if (trainerIds.includes(user.uid)) return true;
      if (
        athleteIds.includes(user.uid) &&
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
      if (
        this.institutionService.canEditExtended(user, institution, {
          allowTrainer: true,
        })
      )
        return true;
    }

    return false;
  }

  canAdd(user: User, institution?: Institution) {
    if (institution)
      return this.institutionService.canEditExtended(user, institution, {
        allowTrainer: true,
        allowAthlete: true,
      });

    return false;
  }
}
