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
import { UserWorkload } from '../entity/user-workload.entity';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly userWorkloadService: UserWorkloadService,
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

  async create(
    user: User,
    input: Create<Omit<Training, 'id' | 'ownerId' | 'membersIds' | 'wellness'>>,
  ): Promise<Training> {
    const { groupId, cycleId } = input;
    this.logger.log(
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
    );

    // validate parent references
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    const cycle = this.groupService.findCycleOrFail(cycleId, group);
    this.validateOwner(user.uid, group);
    this.checkTrainingIsInCycle(input.from, cycle);
    this.validateIsTrainingInFuture(input.from);

    // check overlap between all other trainings
    await this.validateOverlap(input.from, input.to, group.id, cycle.id);

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
    const workloads = await this.userWorkloadService.findAllByMembers(
      group.membersIds,
    );

    const data: Create<Training> = {
      id: null,
      groupId: group.id,
      cycleId: input.cycleId,
      ownerId: user.uid,
      copiedFromId: null,
      from: input.from,
      to: addMinutes(startOfHour(input.from), input.components.length * 30),
      membersIds: group.membersIds,
      wellness,
      components: input.components.map((c, i) => {
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

    this.userWorkloadService.createForTraining(batch, training, workloads);
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
    this.checkTrainingIsInCycle(input.from, cycle);
    this.validateIsTrainingInFuture(input.from);

    // if no components, delete training
    if (input.components.length === 0) {
      await this.trainingRepository.deleteDoc(ref.trainingId);
      return {
        ...training,
        ...this.commonService.object.clean(input),
      };
    }

    // check overlap between all other trainings
    input.from = input.components[0].from;
    input.to = input.components[input.components.length - 1].from;
    await this.validateOverlap(input.from, input.to, groupId, cycleId);

    // validate components & exercises
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

    // for future trainings, update latest meta and calculate workloads
    const wellness = await this.userService.getRecentWellness(membersIds);
    const workloads =
      await this.userWorkloadService.findAllByMembers(membersIds);

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
    this.userWorkloadService.createForTraining(batch, updated, workloads);
    await batch.commit();

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
    const workloads =
      await this.userWorkloadService.findAllByMembers(membersIds);

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

    // create training, add trainer to users, create workloads
    const batch = this.firebaseService.firestore.batch();
    batch.set(trainingDocRef, copyTrainingQuery);

    for (const userId of group.membersIds) {
      const docRef = this.userService.getDoc(userId);
      batch.update(docRef, {
        trainersIds: FieldValue.arrayUnion(user.uid),
      });
    }

    this.userWorkloadService.createForTraining(batch, training, workloads);
    await batch.commit();

    return training;
  }

  async remove(user: User, ref: TrainingRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing training ${ref.trainingId}`);

    const training = await this.findOneOrFail(user, ref);
    this.validateOwner(user.uid, training);
    this.validateIsTrainingInFuture(training.from);

    await this.trainingRepository.deleteDoc(ref.trainingId);
  }

  async createUserWorkloadsForComponent(
    user: User,
    ref: TrainingStatusRef,
    input: UserWorkload[],
  ) {
    this.logger.log(
      `User ${user.uid} is creating workloads for component ${ref.componentId} for training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    if (user.uid !== ref.userId) throw new UnauthorizedException();
    await this.userWorkloadService.updateExercisesWorkloadsByComponent(
      ref,
      input,
    );
  }

  async findAllStatusesByTraining(user: User, ref: TrainingRef) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_STATUS)
      .where('trainingId', '==', ref.trainingId)
      .where('userId', '==', user.uid)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.firebaseService.serialize(
            doc.data() as FirestoreEntity<TrainingStatus>,
          ),
        ),
      );
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
  ) {
    const trainings = await this.trainingRepository.getDocs((q) =>
      q
        .where('groupId', '==', groupId)
        .where('cycleId', '==', cycleId)
        .where('from', '>=', Timestamp.fromDate(startOfDay(from)))
        .where('from', '<', Timestamp.fromDate(endOfDay(from))),
    );

    if (trainings.length >= 2)
      throw new BadRequestException(
        'Maximum number of trainings per day reached',
      );

    const isOverlap = trainings.some(
      (training) =>
        this.commonService.date.isBetween(from, training.from, training.to) ||
        this.commonService.date.isBetween(to, training.from, training.to),
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
