import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { addHours, endOfHour, isAfter, isBefore, startOfHour } from 'date-fns';
import { FieldPath, Query, Timestamp } from 'firebase-admin/firestore';
import { CacheManagerService } from 'src/cache-manager/cache-manager.service';
import { CommonService } from 'src/common/service/common.service';
import { Create, FirestoreEntity, Update } from 'src/common/type/entity.type';
import { Component } from 'src/component/entity/component.entity';
import { UserService } from 'src/user/service/user.service';
import { User } from '../../common/type/firebase-auth.type';
import {
  SubgroupRef,
  TrainingComponentRef,
  TrainingRef,
  UserWorkloadExerciseRef,
} from '../../common/type/firestore.type';
import { Filter, FindManyOptions } from '../../common/type/orm.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { ExerciseService } from '../../exercise/service/exercise.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { Group } from '../../group/entity/group.entity';
import { GroupService } from '../../group/service/group.service';
import { TrainingComponent } from '../entity/training-component.entity';
import { Training } from '../entity/training.entity';
import { WorkloadData } from '../entity/workload-data';
import { TrainingRepository } from '../repository/training.repository';
import { SubgroupService } from './subgroup.service';
import { TrainingPlanService } from './training-plan.service';
import { UserWorkloadService } from './user-workload.service';

@Injectable()
export class TrainingService {
  private logger = new Logger(TrainingService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly cacheManagerService: CacheManagerService,
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly exerciseService: ExerciseService,
    private readonly subgroupService: SubgroupService,
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

  async findAll(
    user: User,
    options?: FindManyOptions<Training>,
  ): Promise<Training[]> {
    let filter = options?.filter || {};

    if (this.firebaseService.isTrainer(user))
      filter.ownerId = { value: user.uid };

    if (this.firebaseService.isAthlete(user)) {
      const dbUser = await this.userService.findOne(user.uid);
      if (dbUser?.groupsIds.length > 0)
        filter.groupId = { op: 'in', value: dbUser.groupsIds };

      filter.membersIds = { value: user.uid };
    }

    return await this.trainingRepository.getDocs((collection) => {
      let query = this.filter(collection, filter);
      query = query.orderBy('from', 'asc');
      return query;
    });
  }

  async create(
    user: User,
    input: Create<
      Omit<Training, 'ownerId' | 'id' | 'membersIds' | 'components' | 'meta'>
    > & { componentsIds: string[] },
  ): Promise<Training> {
    const { groupId, cycleId } = input;
    this.logger.log(
      `User ${user.uid} is creating training: ${JSON.stringify(input)}`,
    );

    // validate parent references
    const group = await this.groupService.findByIdOrFail(user, { groupId });
    this.groupService.findCycleOrFail(cycleId, group);

    // validate trainer and owner
    this.validateTrainer(user);
    this.validateOwner(user.uid, group);

    // validate new trainings time and components
    const components = await this.cacheManagerService.getComponents();
    this.validateComponents(input.componentsIds, components);

    // check overlap between all other trainings
    /* const groupTrainings = await this.getDocsByGroup(group.id);
    await this.validateOverlap(input.from, input.to, groupTrainings); */

    // create training
    const meta = await this.userService.getLastMetas(group.membersIds);
    const data: Create<Training> = {
      id: null,
      groupId: group.id,
      cycleId: input.cycleId,
      ownerId: user.uid,
      copiedFromId: null,
      from: input.from,
      to: input.to,
      membersIds: group.membersIds,
      meta,
      components: input.componentsIds.map((id) => ({
        id,
        color: null,
        from: startOfHour(new Date()),
        to: addHours(endOfHour(new Date()), 1),
        subgroups: [],
        supersets: [{ exercises: [] }],
      })),
    };

    // create training
    const trainingId = await this.trainingRepository.addDoc(data);

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
    source: SubgroupRef, // training can be copied from subgroup
    destination: SubgroupRef,
  ) {}

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
    this.validateTrainer(user);
    this.validateOwner(user.uid, training);

    // if no components, delete training
    if (input.components.length === 0) {
      await this.trainingRepository.deleteDoc(ref.trainingId);
      return { ...training, ...input };
    }

    // validate that data is valid
    const allComponents = await this.cacheManagerService.getComponents();
    // validate all training members to be valid
    // validate all training components to be valid
    // validate all subgroups have unique members (one member cannot be in multiple subgroups)

    // validate limits
    // max members == 20, max components == 5, max subgroups per component == training.members.length, max supersets == 8 per component, max exercises == 4 per superset
    // => 5 components * 8 supersets * 4 exercises = 160 exercises per training * 20 subgroups = 3200 exercises ???

    // validate dates
    // validate each component has correct times (`from` < `to`)
    // validate trainings overlap within the group
    // set training `from` time to first component's `from`
    // set training `to` time to last component's `to`
    // check training is within cycle's from and to

    // if training in the future:
    // - update training's meta to latest user data
    // - recalculate workloads for all members and all subgroups

    await this.trainingRepository.updateDoc(ref.trainingId, input);

    // create user workloads
    const batch = this.firebaseService.firestore.batch();
    const updatedTraining: Training = { ...training, ...input };
    const workloads = await this.userWorkloadService.findAllByMembers(
      training.membersIds,
    );

    this.userWorkloadService.createForTraining(
      batch,
      updatedTraining,
      workloads,
    );

    await batch.commit();

    return { ...training, ...this.commonService.object.clean(input) };
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

  async updateAthleteWorkloadData(
    ref: UserWorkloadExerciseRef,
    input: WorkloadData[],
    user: User,
  ) {
    this.logger.log(
      `User ${user.uid} is updating workload sets (exercise ${ref.exerciseId}) for training ${ref.trainingId}: ${JSON.stringify([input])}`,
    );

    if (user.uid !== ref.userId) throw new UnauthorizedException();
    await this.userWorkloadService.updateData(ref, input);
  }

  async addComponents(
    user: User,
    ref: TrainingRef,
    input: string[],
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
    this.checkValidComponents(input, allComponents);
    this.checkDuplicateComponents(training.components, input, allComponents);

    // get query for training
    const [query, updatedTraining] =
      this.trainingPlanService.getAddComponentsQuery(
        training,
        input.map((id) => ({ id })),
      );

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
    this.validateComponent(training, ref);

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

  private filter(query: Query, filter: Filter<Training>) {
    if (filter.ids?.length)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.groupId?.value)
      query = query.where(
        'groupId',
        filter.groupId?.op || '==',
        filter.groupId.value,
      );

    if (filter.cycleId?.value)
      query = query.where('cycleId', '==', filter.cycleId.value);

    if (filter.ownerId)
      query = query.where('ownerId', '==', filter.ownerId.value);

    if (filter.membersIds)
      query = query.where(
        'membersIds',
        'array-contains',
        filter.membersIds.value,
      );

    if (filter.copiedFromId)
      query = query.where(
        'copiedFromId',
        filter.copiedFromId.op || '==',
        filter.copiedFromId.value,
      );

    if (filter.from && filter.to) {
      query = query.where('from', '>=', Timestamp.fromDate(filter.from.value));
      query = query.where('to', '<=', Timestamp.fromDate(filter.to.value));
    }

    if (filter.from)
      query = query.where(
        'from',
        filter.from.op || '>=',
        Timestamp.fromDate(filter.from.value),
      );

    if (filter.to)
      query = query.where(
        'to',
        filter.to.op || '<=',
        Timestamp.fromDate(filter.to.value),
      );

    return query;
  }

  private isAuthorized(user: User, training: Training): boolean {
    return (
      training.ownerId === user.uid || training.membersIds.includes(user.uid)
    );
  }

  private validateTime(from: Date, to: Date) {
    if (this.commonService.date.isAfter(from, to))
      throw new BadRequestException('Invalid training time');
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

  private validateComponents(componentsIds: string[], components: Component[]) {
    for (const componentId of componentsIds) {
      const component = components.find((c) => c.id === componentId);
      if (component.parent)
        throw new BadRequestException(`Component ${component.id} is not root`);
    }
  }

  private validateTrainingMembers(training: Training, memberIds: string[]) {
    if (training.membersIds.some((memberId) => memberIds.includes(memberId)))
      throw new BadRequestException('You cannot add these members to training');
  }

  private async validateOverlap(
    from: Date,
    to: Date,
    trainings: Pick<Training, 'from' | 'to'>[],
  ): Promise<void> {
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

  private validateComponent(training: Training, ref: TrainingComponentRef) {
    if (!training.components.find((c) => c.id === ref.componentId))
      throw new BadRequestException('Training component not found');
  }
}
