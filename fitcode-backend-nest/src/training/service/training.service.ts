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
} from 'date-fns';
import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { CommonService } from '../../common/service/common.service';
import { Create, FirestoreEntity, Update } from '../../common/type/entity.type';
import { User } from '../../common/type/firebase-auth.type';
import {
  TrainingComponentRef,
  TrainingRef,
  TrainingStatusRef,
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
import { TrainingStatus } from '../entity/training-status.entity';
import { Training } from '../entity/training.entity';
import { TrainingRepository } from '../repository/training.repository';
import { TrainingPlanService } from './training-plan.service';
import { UserWorkloadService } from './user-workload.service';
import { Workload } from '../entity/workload.entity';
import { CreateWorkload } from '../dto/create-workload.dto';
import dayjs from 'dayjs';

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

  async create(
    user: User,
    input: Create<
      Omit<
        Training,
        'id' | 'ownerId' | 'membersIds' | 'wellness' | 'from' | 'to'
      >
    >,
  ): Promise<Training> {
    const { groupId, cycleId } = input;
    this.logger.log(
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
    );

    // validate parent references
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);
    const { from, to } = this.getFromAndToDates(input.components);

    this.validateOwner(user.uid, group);
    this.checkTrainingIsInCycle(from, cycle);
    this.validateIsTrainingInFuture(from);
    await this.validateOverlap(from, to, group.id, cycle.id);

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
      input.components,
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
    const workloads = await this.workloadService.findAllByMembers(
      group.membersIds,
    );

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
      components: input.components.map((c) => ({
        id: c.id,
        from: c.from,
        to: c.to,
        color: c.color,
        subgroups: c.subgroups || [],
        supersets: c.supersets || [],
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
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
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
      [trainingComponent],
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

    const data: Create<Training> = {
      id: null,
      groupId: group.id,
      cycleId: cycleId,
      ownerId: user.uid,
      copiedFromId: null,
      from,
      to,
      membersIds: group.membersIds,
      wellness,
      components: [
        {
          id: trainingComponent.id,
          from: from,
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

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      membersIds,
      input.components,
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

  async updateMultiple(
    user: User,
    input: Update<Training>[],
  ): Promise<Training[]> {
    this.logger.log(
      `User ${user.uid} is updating multiple trainings: ${JSON.stringify(input)}`,
    );

    const updated = [];
    for (const trainingInput of input) {
      const ref = { trainingId: trainingInput.id };
      // validate training
      const training = await this.findOneOrFail(user, ref);
      const { groupId, cycleId } = training;

      const group = await this.groupService.findByIdOrFail(user, { groupId });
      const cycle = this.groupService.findCycleOrFail(cycleId, group);
      this.validateOwner(user.uid, training);

      // if no components, delete training
      if (training.components.length === 0) {
        await this.trainingRepository.deleteDoc(ref.trainingId);
        updated.push({
          ...training,
          ...this.commonService.object.clean(trainingInput),
        });
      }

      const { from, to } = this.getFromAndToDates(trainingInput.components);
      this.checkTrainingIsInCycle(from, cycle);
      this.validateIsTrainingInFuture(from);
      await this.validateOverlap(from, to, groupId, cycleId, training.id);

      // validate components & exercises
      const attributes = await this.cacheManagerService.getAttributes();
      const components = await this.cacheManagerService.getComponents();
      const membersIds = trainingInput.membersIds || training.membersIds;
      await this.validateTrainingMembers(membersIds);

      const exercises = await this.trainingPlanService.findAllTrainingExercises(
        user,
        trainingInput.components,
      );

      this.trainingPlanService.validateTrainingComponents(
        exercises,
        membersIds,
        trainingInput.components,
        components,
      );

      // populate exercise params from components
      this.trainingPlanService.populateTrainingExerciseParams(
        trainingInput.components,
        components,
        exercises,
        attributes,
      );

      // for future trainings, update latest meta and calculate workloads
      const wellness = await this.userService.getRecentWellness(membersIds);
      const workloads = await this.workloadService.findAllByMembers(membersIds);

      const updatedTrainig = {
        ...training,
        ...this.commonService.object.clean(trainingInput),
      };

      updated.push(updatedTrainig);

      const trainingDocRef = this.trainingRepository.doc(ref.trainingId);
      const updateTrainingQuery =
        this.firebaseService.buildUpdateQuery<Training>({
          ...trainingInput,
          wellness,
        });

      const batch = this.firebaseService.firestore.batch();
      batch.update(trainingDocRef, updateTrainingQuery);
      this.workloadService.createForTraining(batch, updatedTrainig, workloads);
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

    this.checkTrainingIsInCycle(input.from, cycle);
    this.validateIsTrainingInFuture(input.from);
    await this.validateOverlap(
      input.from,
      training.components[training.components.length - 1].from,
      groupId,
      cycleId,
    );

    // validate components & exercises in case user cannot view exercises of another user
    const components = await this.cacheManagerService.getComponents();
    const membersIds = input.membersIds || training.membersIds;
    await this.validateTrainingMembers(membersIds);

    const exercises = await this.trainingPlanService.findAllTrainingExercises(
      user,
      training.components,
    );

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      membersIds,
      training.components,
      components,
    );

    // for future trainings, update latest meta and calculate workloads
    const wellness = await this.userService.getRecentWellness(membersIds);
    const data: Create<Training> = {
      id: null,
      groupId: training.groupId,
      cycleId: training.cycleId,
      ownerId: user.uid,
      copiedFromId: training.id,
      from: input.from,
      to: addMinutes(startOfHour(input.from), training.components.length * 30),
      membersIds: training.membersIds,
      wellness,
      components: training.components.map((c, i) => {
        const from = addMinutes(startOfHour(input.from), i * 30);
        const to = addMinutes(from, 30);

        return {
          id: c.id,
          from: c.from ? c.from : from,
          to: c.to ? c.to : to,
          color: c.color,
          subgroups: c.subgroups || [],
          supersets: c.supersets || [],
        };
      }),
    };

    const trainingDocRef = this.trainingRepository.collection().doc();
    const copiedTraining: Training = {
      id: trainingDocRef.id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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

    this.workloadService.createForTraining(batch, training, workloads);
    await batch.commit();

    return training;
  }

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
      newComponents,
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

    this.trainingPlanService.validateTrainingComponents(
      exercises,
      training.membersIds,
      trainingComponents,
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
