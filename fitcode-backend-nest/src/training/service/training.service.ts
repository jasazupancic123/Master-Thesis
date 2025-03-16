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
  addMinutes,
  endOfDay,
  isAfter,
  isBefore,
  startOfDay,
  startOfHour,
} from 'date-fns';
import { FieldValue, Query, Timestamp } from 'firebase-admin/firestore';
import { CacheManagerService } from '../../cache-manager/cache-manager.service';
import { DateFilterDto } from '../../common/dto/date-filter.dto';
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
import { Component } from '../../component/entity/component.entity';
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
import { ExerciseService } from '../../exercise/service/exercise.service';
import { Exercise } from 'src/exercise/entity/exercise.entity';

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
    @Inject(forwardRef(() => ExerciseService))
    private readonly exerciseService: Wrapper<ExerciseService>,
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
    this.groupService.findCycleOrFail(cycleId, group);
    this.validateOwner(user.uid, group);

    // validate components & exercises
    const components = await this.cacheManagerService.getComponents();
    const trainingExercises = input.components.flatMap((c) => [
      ...c.supersets.flatMap((s) => s.exercises),
      ...c.subgroups.flatMap((s) => s.supersets.flatMap((s) => s.exercises)),
    ]);

    const ids = [...new Set(trainingExercises.map((e) => e.id))];
    const exercises =
      ids.length > 0 ? await this.exerciseService.findAllByIds(user, ids) : [];

    this.validateComponents(
      group.membersIds,
      input.components,
      components,
      exercises,
    );

    // check overlap between all other trainings
    const trainings = await this.trainingRepository.getDocs((q) =>
      q
        .where('groupId', '==', input.groupId)
        .where('cycleId', '==', input.cycleId)
        .where('from', '>=', Timestamp.fromDate(startOfDay(input.from)))
        .where('from', '<', Timestamp.fromDate(endOfDay(input.from))),
    );

    this.validateOverlap(input.from, input.to, trainings);

    // create training
    const wellness = await this.userService.getRecentWellness(group.membersIds);
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

    let trainingId: string;
    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // create training
      const docRef = this.trainingRepository.collection().doc();
      const query = this.firebaseService.buildCreateQuery<Training>(
        { ...data, id: docRef.id },
        { timestamps: true },
      );

      trainingId = docRef.id;
      transaction.set(docRef, query);

      // add trainer to users
      for (const userId of group.membersIds) {
        const docRef = this.userService.getDoc(userId);
        transaction.update(docRef, {
          trainersIds: FieldValue.arrayUnion(user.uid),
        });
      }
    });

    // NOTE - there are no exercises yet, so no calculation of user workloads

    return {
      ...data,
      id: trainingId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async copy(
    user: User,
    ref: TrainingRef,
    input: DateFilterDto,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is copying training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // check overlap between all other trainings
    const trainings = await this.findAll(user, {
      from: startOfDay(input.from),
      to: endOfDay(input.from),
    });

    this.validateOverlap(input.from, input.to, trainings);

    if (trainings.length >= 2)
      throw new BadRequestException(
        'Maximum number of trainings reached for selected day',
      );

    const training = await this.findOneOrFail(user, ref);

    // create new training
    const meta = await this.userService.getRecentWellness(training.membersIds);
    const data: Create<Training> = {
      id: null,
      groupId: training.groupId,
      cycleId: training.cycleId,
      ownerId: user.uid,
      copiedFromId: training.id,
      from: input.from,
      to: addMinutes(startOfHour(input.from), training.components.length * 30),
      membersIds: training.membersIds,
      wellness: meta,
      components: training.components.map((c, i) => {
        const from = addMinutes(startOfHour(input.from), i * 30);
        const to = addMinutes(from, 30);
        return { ...c, from, to };
      }),
    };

    const workloads = await this.userWorkloadService.findAllByMembers(
      training.membersIds,
    );

    let updatedTraining: Training = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // create training
      const docRef = this.trainingRepository.collection().doc();
      const query = this.firebaseService.buildCreateQuery<Training>(
        { ...data, id: docRef.id },
        { timestamps: true },
      );

      updatedTraining.id = docRef.id;
      transaction.set(docRef, query);

      // add trainer to users
      for (const userId of training.membersIds) {
        const docRef = this.userService.getDoc(userId);
        transaction.update(docRef, {
          trainersIds: FieldValue.arrayUnion(user.uid),
        });
      }

      // create training worklaods for new copied training
      this.userWorkloadService.createForTraining(
        transaction,
        updatedTraining,
        workloads,
      );
    });

    return updatedTraining;
  }

  async update(
    user: User,
    ref: TrainingRef,
    input: Update<Training>,
  ): Promise<Training> {
    this.logger.log(
      `User ${user.uid} is updating training ${ref.trainingId}: ${JSON.stringify(input)}`,
    );

    // validate ownership
    const training = await this.findOneOrFail(user, ref);
    const group = await this.groupService.findByIdOrFail(user, {
      groupId: training.groupId,
    });
    const cycle = this.groupService.findCycleOrFail(training.cycleId, group);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // if no components, delete training
    if (input.components.length === 0) {
      await this.trainingRepository.deleteDoc(ref.trainingId);
      return { ...training, ...input } as Training;
    }

    // validate that data is valid
    const allComponents = await this.cacheManagerService.getComponents();
    /* this.validateComponents(
      training.membersIds,
      input.components,
      allComponents,
    ); */

    this.validateTrainingComponentDates(input.components);
    this.checkTrainingIsInCycle(input.from, cycle);

    input.from = input.components[0].from;
    input.to = input.components[input.components.length - 1].from;

    /* if (isAfter(new Date(), training.from)) { */

    // for future trainings, update latest meta and calculate workloads
    const wellness = await this.userService.getRecentWellness(
      training.membersIds,
    );
    await this.trainingRepository.updateDoc(ref.trainingId, {
      ...input,
      wellness,
    });

    // create user workloads
    const workloads = await this.userWorkloadService.findAllByMembers(
      training.membersIds,
    );

    const batch = this.firebaseService.firestore.batch();
    const updated = { ...training, ...input } as Training;
    this.userWorkloadService.createForTraining(batch, updated, workloads);
    await batch.commit();
    /* } else {
      // for past trainings, don't update meta and workloads
      await this.trainingRepository.updateDoc(ref.trainingId, input);
    } */

    return {
      ...training,
      ...this.commonService.object.clean(input),
    } as Training;
  }

  async remove(user: User, ref: TrainingRef): Promise<void> {
    this.logger.log(`User ${user.uid} is removing training ${ref.trainingId}`);

    // validate parent references and ownership
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // delete training
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
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // validate input
    const allComponents = await this.cacheManagerService.getComponents();
    const componentIds = input.map((c) => c.id);
    this.checkValidComponents(componentIds, allComponents);
    this.checkDuplicateComponents(
      training.components,
      componentIds,
      allComponents,
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

    // validate
    const training = await this.findOneOrFail(user, ref);
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

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

  private validateTrainer(user: User) {
    if (!this.firebaseService.isTrainer(user))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private validateOwner(userId: string, groupOrTraining: Group | Training) {
    if (!this.groupService.isOwner(userId, groupOrTraining))
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
  }

  private validateComponents(
    trainingMemberIds: string[],
    trainingComponents: TrainingComponent[],
    allComponents: Component[],
    exercises: Exercise[],
  ) {
    if (trainingComponents.length > 5)
      throw new ConflictException(
        'You can only have up to 5 components per training',
      );

    for (const trainingComponent of trainingComponents) {
      const component = allComponents.find(
        (c) => c.id === trainingComponent.id,
      );

      if (!component) throw new NotFoundException('Component does not exist');
      if (component.parentId)
        throw new BadRequestException(
          `Component ${component.id} cannot be selected for training`,
        );

      if (exercises.length > 0)
        this.exerciseService.validateExercises(
          component.id,
          exercises,
          allComponents,
        );

      this.validateSupersets(trainingComponent, exercises);
      this.validateSubgroups(trainingMemberIds, trainingComponent, exercises);
    }
  }

  private validateSupersets(
    component: TrainingComponent,
    exercises: Exercise[],
  ) {
    if (component.supersets.length > 8)
      throw new ConflictException(
        'You can only have up to 8 supersets per training component',
      );

    for (const superset of component.supersets) {
      if (superset.exercises.length > 4)
        throw new ConflictException(
          'You can only have up to 4 exercises per superset',
        );

      for (const exercise of superset.exercises) {
        const trainingExercise = exercises.find((e) => e.id === exercise.id);
        if (!trainingExercise)
          throw new NotFoundException('Training exercise not found');
      }
    }
  }

  private validateSubgroups(
    trainingMemberIds: string[],
    component: TrainingComponent,
    exercises: Exercise[],
  ) {
    // validate all subgroups have unique members (one member cannot be in multiple subgroups)
    const trainingMemberIdsSet = new Set(trainingMemberIds);
    const membersIdsSet = new Set<string>();

    for (const subgroup of component.subgroups) {
      for (const userId of subgroup.membersIds) {
        if (!trainingMemberIdsSet.has(userId) || membersIdsSet.has(userId))
          throw new ConflictException(
            `Member ${userId} cannot be in multiple subgroups in the same training component`,
          );

        membersIdsSet.add(userId);
      }

      this.validateSupersets(component, exercises);
    }
  }

  private validateOverlap(
    from: Date,
    to: Date,
    trainings: Pick<Training, 'from' | 'to'>[],
  ) {
    const isOverlap = trainings.some(
      (training) =>
        (isBefore(from, training.from) && isAfter(to, training.to)) ||
        (isAfter(from, training.from) && isBefore(to, training.to)) ||
        (isBefore(from, training.to) && isAfter(to, training.from)) ||
        (isAfter(from, training.from) && isBefore(to, training.to)),
    );

    if (isOverlap)
      throw new BadRequestException('Training overlaps with other training');
  }

  private checkValidComponents(
    componentIds: string[],
    components: Component[],
  ) {
    if (!components.some((component) => componentIds.includes(component.id)))
      throw new BadRequestException('Some components are invalid');
  }

  private checkDuplicateComponents(
    existingComponents: TrainingComponent[],
    inputComponentIds: string[],
    allComponents: Component[],
  ) {
    // components must be unique
    const duplicates: Component[] = [];
    for (const id of inputComponentIds)
      if (existingComponents.find((c) => c.id === id))
        duplicates.push(allComponents.find((c) => c.id === id));

    if (duplicates.length)
      throw new BadRequestException(`Duplicate components`);
  }

  private validateTrainingComponentDates(components: TrainingComponent[]) {
    for (let i = 0; i < components.length; i++) {
      if (i < components.length - 1)
        if (components[i].from >= components[i + 1].from)
          throw new BadRequestException(
            `Component ${components[i].id} has to start before ${components[i + 1].id}`,
          );
    }
  }
}
