import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  addMinutes,
  differenceInMinutes,
  endOfDay,
  isBefore,
  startOfDay,
  startOfHour,
  subMinutes,
} from 'date-fns';
import { Query, Timestamp } from 'firebase-admin/firestore';

import { AttributeService } from '@src/attribute/service/attribute.service';
import { LogMethod } from '@src/common/decorator/log-method.decorator';
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
import { ComponentService } from '@src/component/component.service';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import { IntType, ParamType } from '@src/component/enum/param.enum';
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
import { UserService } from '@src/user/service/user.service';

import { CopyComponentDto } from '../dto/copy-component.dto';
import { CopyTrainingDto } from '../dto/copy-training.dto';
import { CreateTrainingDto } from '../dto/create-training.dto';
import { PeriodizeTrainingsDto } from '../dto/periodize-training.dto';
import { CompletedTrainingComponent } from '../entity/completed-training.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Superset } from '../entity/superset.entity';
import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Workload } from '../entity/workload.entity';
import { MainSet } from '../enum/main-set.enum';
import { UpdateTraining } from '../interface/update-training.interface';
import { TrainingRepository } from '../repository/training.repository';
import { WorkloadRepository } from '../repository/workload.repository';
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
    private readonly userService: UserService,
    private readonly periodizationService: PeriodizationService,
    private readonly repository: TrainingRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadRepository: WorkloadRepository,
    private readonly workloadService: WorkloadService,
    private readonly groupService: GroupService,
    private readonly institutionService: InstitutionService,
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
  ): Promise<Training[]> {
    return await this.repository.findAll((q) => {
      // filter by roles
      if (
        this.firebaseService.isTrainer(user) ||
        this.firebaseService.isManager(user)
      )
        q = q.where('ownerId', '==', user.uid);
      else if (this.firebaseService.isAthlete(user))
        q = q.where('membersIds', 'array-contains', user.uid);

      // filter by other params
      if (filter?.institutionId)
        q = q.where('institutionId', '==', filter.institutionId);
      if (filter?.groupId) q = q.where('groupId', '==', filter.groupId);
      if (filter?.cycleId) q = q.where('cycleId', '==', filter.cycleId);

      // filter by date
      if (filter?.from)
        q = q.where('from', '>=', Timestamp.fromDate(new Date(filter.from)));
      if (filter?.to)
        q = q.where('to', '<=', Timestamp.fromDate(new Date(filter.to)));

      q = q.orderBy('from', 'asc');
      if (options?.limit) q = q.limit(options.limit);
      return q;
    });
  }

  @LogMethod()
  async findAthleteWorkloads(
    user: User,
    ref: TrainingRef & UserRef,
  ): Promise<{ completedWorkloads: Workload[]; futureWorkloads: Workload[] }> {
    const training = await this.findOneByIdOrFail(user, ref);
    const athlete = await this.getAthlete(user, ref.uid, training.institution);

    const workloads = await this.workloadService.getDocs(ref, (q) =>
      q.where('userId', '==', athlete.uid),
    );

    return { completedWorkloads: [], futureWorkloads: workloads };
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

    const inputComponents: TrainingComponent[] = input.components.map((c) => ({
      id: c.id,
      from: new Date(c.from),
      to: new Date(c.to),
      supersets: [],
      subgroups: [],
      mainSet: MainSet.BLOCK,
      completedMembersIds: [],
    }));

    // add warmup and cooldown components
    const { warmup, cooldown } =
      this.trainingPlanService.getWarmupAndCooldown(inputComponents);

    inputComponents.unshift(warmup);
    inputComponents.push(cooldown);

    this.updateTrainingTimes(inputComponents);
    this.validateIsDateInCycle(warmup.from, cycle);
    this.validateIsDateInFuture(warmup.from);
    await this.validateOverlap(
      user,
      { groupId, cycleId, trainingId: null }, // no trainingId for new training
      warmup.from,
      cooldown.to,
    );

    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();
    const membersIds = group ? group.membersIds : input.membersIds;

    const trainingComponents =
      this.trainingPlanService.validateTrainingComponents(
        null,
        inputComponents,
        membersIds,
        {
          components,
          methods,
          exercises: [],
          attributes: [],
        },
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
      completedMembersIds: [],
      stats: [],
      // futureStats: input.futureStats || [],
      warmup,
      cooldown,
      components: trainingComponents
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
          completedMembersIds: [],
        })),
    };

    const id = await this.repository.save(data);
    return {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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

    let cycle: Cycle | null = null;
    if (groupId && cycleId) {
      const group = await this.groupService.findOneByIdOrFail(user, {
        groupId,
      });

      cycle = this.groupService.findCycleOrFail(cycleId, group);
      this.validateCanEdit(user, training, training.institution);
    }

    // if no components, delete training
    if (input.components.length === 0) {
      await this.repository.delete(ref.trainingId);
      return { ...training, completedMembersIds: [] };
    }

    input.components.unshift(input.warmup);
    input.components.push(input.cooldown);

    this.updateTrainingTimes(input.components);
    const from = input.warmup.from;
    const to = input.cooldown.to;

    if (cycle) this.validateIsDateInCycle(from, cycle);
    this.validateIsDateInFuture(from);
    await this.validateOverlap(
      user,
      { groupId, cycleId, trainingId: ref.trainingId },
      from,
      to,
    );

    // validate components & exercises
    const attributes = await this.attributeService.findAll();
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();

    const exercises = await this.trainingPlanService.getAllTrainingExercises(
      input.components,
    );

    const trainingComponents =
      this.trainingPlanService.validateTrainingComponents(
        training,
        input.components,
        training.membersIds,
        { exercises, components, methods, attributes },
      );

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
      from,
      to,
      components: trainingComponents.filter(
        (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID,
      ),
      warmup: input.warmup,
      cooldown: input.cooldown,
      completedMembersIds: training.completedMembersIds,
    };

    await this.repository.update(ref.trainingId, updateTraining);
    return { ...training, ...updateTraining };
  }

  @LogMethod()
  async updateMembers(user: User, ref: TrainingRef, input: UpdateMembersDto) {
    const { userId: memberId, add } = input;

    // validate
    const training = await this.findOneByIdOrFail(user, ref);
    if (!this.canEdit(user, training, training.institution))
      throw new UnauthorizedException('You are not allowed to update members');

    // check if member exists
    const member = await this.userService.findOneBy('id', memberId);
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

  @LogMethod()
  async copy(
    user: User,
    ref: TrainingRef,
    input: CopyTrainingDto,
  ): Promise<Training> {
    const training = await this.findOneByIdOrFail(user, ref);
    const { groupId, cycleId } = training;
    const group = await this.groupService.findOneByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);

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
      completedMembersIds: [],
      stats: training.stats || [],
      // futureStats: training.futureStats || [],
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
          target: c.target || null,
          methodId: c.methodId || null,
          completedMembersIds: [],
          mainSet: c.mainSet,
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

    // for future trainings, update latest meta and calculate workloads
    this.validateIsDateInCycle(input.from, cycle);
    this.validateIsDateInFuture(input.from);
    await this.validateOverlap(
      user,
      { groupId, cycleId, trainingId: null }, // no trainingId for new training
      data.from,
      data.components[data.components.length - 1].from,
    );

    // validate components & exercises in case user cannot view exercises of another user
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();
    const attributes = await this.attributeService.findAll();

    const exercises = await this.trainingPlanService.getAllTrainingExercises(
      data.components,
    );

    const membersIds =
      input.membersIds?.length > 0 ? input.membersIds : training.membersIds;

    const trainingComponents =
      this.trainingPlanService.validateTrainingComponents(
        null,
        [data.warmup, ...data.components, data.cooldown],
        membersIds,
        { exercises, components, methods, attributes },
      );

    // create training, add trainer to users, create workloads
    const id = await this.repository.save({
      ...data,
      components: trainingComponents,
    });

    return {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
      /* const futureStats = trainingFrom.futureStats.filter(
        (fs) => fs.rootComponentId === componentId,
      ); */

      return await this.create(user, {
        ...trainingFrom,
        // futureStats,
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

    return await this.update(user, copyToRef, {
      ...trainingTo,
      components: newComponents,
    });
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
    input: TrainingComponent[],
  ): Promise<Training> {
    const training = await this.findOneByIdOrFail(user, ref);
    this.validateCanEdit(user, training, training.institution);
    this.validateIsDateInFuture(training.from);

    // validate components & exercises
    const components = await this.componentService.findAllFlat();
    const methods = await this.methodService.findAll();
    const attributes = await this.attributeService.findAll();

    const trainingComponents = [
      training.warmup,
      ...training.components,
      ...input,
      training.cooldown,
    ];

    const exercises =
      await this.trainingPlanService.getAllTrainingExercises(
        trainingComponents,
      );

    this.updateTrainingTimes(trainingComponents);

    const validTrainingComponents =
      this.trainingPlanService.validateTrainingComponents(
        training,
        trainingComponents,
        training.membersIds,
        { exercises, components, methods, attributes },
      );

    const inputTrainingComponents = validTrainingComponents
      .filter(
        (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID,
      )
      .filter((c) => input.some((ic) => ic.id === c.id));

    // get query for training
    const [query, updatedTraining] =
      this.trainingPlanService.getAddComponentsQuery(
        training,
        inputTrainingComponents,
      );

    // add components
    await this.repository.update(training.id, query);

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

    if (filtered.length === 0) {
      await this.repository.delete(ref.trainingId);
      return { ...training, components: [] };
    }

    filtered.unshift(training.warmup);
    filtered.push(training.cooldown);
    this.updateTrainingTimes(filtered);

    training.components = filtered.filter(
      (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID,
    );

    // get query for training
    const [query, updatedTraining] =
      this.trainingPlanService.getDeleteComponentQuery(training, ref);

    // delete component
    await this.repository.update(ref.trainingId, query);
    return updatedTraining;
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
    const stats = this.trainingPlanService.recalculateCompletedTrainingStats(
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

    await this.repository.update(trainingId, {
      stats,
      ...addCompletedMembersQuery,
    });

    return updatedTraining;
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
        completedMembersIds: [],
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
    const bw = await this.userService.getLastBodyweight(ref);
    if (!bw || bw < 20) return;

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
        if (!best || !best.intWork1ValueL || !best.volWork1ValueL) return 20;

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

    const found = await this.userService.findOneBy('id', athleteId);
    if (!found) throw new NotFoundException('Athlete does not exist');

    if (institution)
      if (!this.institutionService.canView(found, institution))
        throw new UnauthorizedException(
          `Athlete ${found.displayName || found.email} cannot view institution ${institution.name}`,
        );

    return found;
  }

  private updateTrainingTimes(
    newComponents: Pick<TrainingComponent, 'id' | 'from' | 'to'>[], // with warmup and cooldown
  ) {
    // sort new components by from date
    const sorted = newComponents
      .filter(
        (c) => c.id !== WARMUP_COMPONENT_ID && c.id !== COOLDOWN_COMPONENT_ID,
      ) // remove warmup and cooldown components for sorting
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

    if (sorted.length < 1)
      // 2 are reserved for warmup and cooldown
      throw new BadRequestException(
        'Training must have at least one component',
      );

    const warmup = newComponents.find((c) => c.id === WARMUP_COMPONENT_ID);
    const cooldown = newComponents.find((c) => c.id === COOLDOWN_COMPONENT_ID);

    const warmupDurationMin = differenceInMinutes(warmup!.to, warmup!.from);
    const cooldownDurationMin = differenceInMinutes(
      cooldown!.to,
      cooldown!.from,
    );

    // update warmup and cooldown times
    warmup!.from = subMinutes(sorted[0].from, warmupDurationMin);
    warmup!.to = sorted[0].from;

    cooldown!.from = sorted[sorted.length - 1].to;
    cooldown!.to = addMinutes(
      sorted[sorted.length - 1].to,
      cooldownDurationMin,
    );

    sorted.unshift(warmup!);
    sorted.push(cooldown!);

    const duration = differenceInMinutes(
      sorted[0].to,
      sorted[sorted.length - 1].from,
    );

    const maxDuration = 4 * 60; // 4 hours in minutes
    if (duration > maxDuration)
      throw new BadRequestException('Training cannot last more than 4 hours');

    // make sure that new components' times are continuous
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      curr.to = next.from;
    }
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
        { limit: 50 },
      )
    ).filter((t) => t.id !== ref.trainingId); // filter out the training being added/updated

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
