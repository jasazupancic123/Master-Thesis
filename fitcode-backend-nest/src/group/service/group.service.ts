import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Group } from '../entity/group.entity';
import { UserService } from '../../user/service/user.service';
import { FieldPath, Query, Timestamp } from 'firebase-admin/firestore';
import { TrainingService } from '../../training/service/training.service';
import { CommonService } from '../../common/service/common.service';
import { Subgroup } from '../../training/entity/subgroup.entity';
import { Filter, FindManyOptions } from '../../common/type/orm.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { CycleRef, GroupRef } from '../../common/type/firebase-firestore.type';
import { GroupRepository } from '../repository/group.repository';
import { CreateGroup, UpdateGroup } from '../type/group.type';
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { CreateCycle, UpdateCycle } from '../type/cycle.type';
import { Cycle } from '../entity/cycle.entity';
import { Training } from 'src/training/entity/training.entity';

@Injectable()
export class GroupService {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  isAuthorized(user: User, group: Group): boolean {
    return this.isMember(user.uid, group) || this.isOwner(user.uid, group);
  }

  isMember(userId: string, group: Group | Subgroup): boolean {
    return group.membersIds.includes(userId);
  }

  isOwner(userId: string, groupOrTraining: Group | Training): boolean {
    return groupOrTraining.ownerId === userId;
  }

  getActiveCycle(group: Group, date = new Date()): Cycle | null {
    return (
      group.cycles.find(
        (cycle) =>
          this.commonService.date.isBefore(date, cycle.to) &&
          this.commonService.date.isAfter(date, cycle.from),
      ) || null
    );
  }

  async findAll(
    user: User,
    options?: FindManyOptions<Group>,
  ): Promise<Group[]> {
    const groups = await this.groupRepository.getDocs((collection) => {
      let query = this.firebaseService.isTrainer(user)
        ? collection.where('ownerId', '==', user.uid)
        : this.firebaseService.isAthlete(user)
          ? collection.where('membersIds', 'array-contains', user.uid)
          : collection;

      query = query.where('deletedAt', '==', null);
      if (options?.filter) query = this.filter(query, options.filter);

      return query;
    });

    return groups;
  }

  async findOne(user: User, ref: Required<GroupRef>): Promise<Group | null> {
    // find group
    const group = await this.groupRepository.getDoc(ref.groupId);
    if (!group || group.deletedAt) return null;

    // authorize
    if (!this.isAuthorized(user, group)) return null;
    return group;
  }

  async findOneOrFail(user: User, ref: Required<GroupRef>): Promise<Group> {
    const group = await this.findOne(user, ref);
    if (!group) throw new BadRequestException('Group not found');
    return group;
  }

  async create(user: User, input: CreateGroup): Promise<Group> {
    this.logger.log(
      `User ${user.uid} is creating group: ${JSON.stringify(input)}`,
    );

    // validate members
    await this.validateMembers(input.membersIds);

    let groupId: string;
    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // add group
      const docRef = this.groupRepository.collection().doc();
      transaction.set(docRef, {
        ownerId: user.uid,
        name: input.name,
        membersIds: input.membersIds,
      });

      // add group to all members and trainer
      groupId = docRef.id;
      [...input.membersIds, user.uid].map((userId) =>
        this.userService.addGroup(transaction, userId, groupId),
      );
    });

    return {
      id: groupId,
      name: input.name,
      ownerId: user.uid,
      membersIds: input.membersIds,
      cycles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(
    user: User,
    ref: Required<GroupRef>,
    input: UpdateGroup,
  ): Promise<Group> {
    this.logger.log(
      `User ${user.uid} is updating group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    const group = await this.findOneOrFail(user, ref);

    // update members and name
    if (input.membersIds) {
      const trainingDocs = await this.trainingService.getDocs((query) =>
        query.where('groupId', '==', ref.groupId),
      );

      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          trainingDocs.forEach((doc) => {
            transaction.update(doc.ref, { membersIds: input.membersIds });
          });

          const docRef = this.groupRepository.doc(ref.groupId);
          transaction.update(docRef, input);
        },
      );
    } else if (input.name)
      // update only name
      await this.groupRepository.updateDoc(ref.groupId, input);

    return { ...group, ...input };
  }

  /**
   * Soft deletes a group by setting the deletedAt field to the current date.
   */
  async remove(user: User, ref: Required<GroupRef>): Promise<void> {
    this.logger.log(`User ${user.uid} is removing group ${ref.groupId}`);
    const group = await this.findOneOrFail(user, ref);

    await this.firebaseService.firestore.runTransaction(async (transaction) => {
      // remove group from all members
      group.membersIds.map((userId) =>
        this.userService.removeGroup(transaction, userId, group.id),
      );

      // remove group from owner
      this.userService.removeGroup(transaction, user.uid, group.id);

      // soft delete group
      const docRef = this.groupRepository.doc(group.id);
      transaction.set(docRef, { deletedAt: Timestamp.now() });
    });
  }

  findCycle(cycleId: string, group: Group) {
    return group.cycles.find((cycle) => cycle.id === cycleId);
  }

  findCycleOrFail(cycleId: string, group: Group) {
    const cycle = this.findCycle(cycleId, group);
    if (!cycle) throw new BadRequestException('Cycle does not exist');
    return cycle;
  }

  async addCycle(
    user: User,
    ref: Required<GroupRef>,
    input: CreateCycle,
  ): Promise<Cycle> {
    this.logger.log(
      `User ${user.uid} adding cycle to group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    const group = await this.findOneOrFail(user, ref);

    // check cycle overlap
    this.checkCycleOverlap(group.cycles, input as Cycle);

    // add cycle to group
    const id = await this.groupRepository.addCycle(group.id, input);

    return {
      id,
      weeks: this.commonService.date.weeks(input.from, input.to),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...input,
    };
  }

  async updateCycle(
    user: User,
    ref: Required<CycleRef>,
    input: UpdateCycle,
  ): Promise<Cycle> {
    this.logger.log(
      `User ${user.uid} updating cycle ${ref.cycleId}: ${JSON.stringify(input)}`,
    );

    const group = await this.findOneOrFail(user, ref);
    const cycle = this.findCycleOrFail(ref.cycleId, group);

    if (input.from || input.to)
      this.checkCycleOverlap(
        group.cycles.filter((c) => c.id !== cycle.id),
        {
          from: input.from || cycle.from,
          to: input.to || cycle.to,
        } as Cycle,
      );

    await this.groupRepository.updateCycle(group.id, ref.cycleId, input);
    return { ...cycle, ...input };
  }

  async deleteCycle(ref: Required<CycleRef>, user: User) {
    this.logger.log(`User ${user.uid} removing cycle ${ref.cycleId}`);
    const group = await this.findOneOrFail(user, ref);
    this.findCycleOrFail(ref.cycleId, group);
    await this.groupRepository.deleteCycle(ref.groupId, ref.cycleId);
  }

  private filter(query: Query, filter: Filter<Group>) {
    if (filter.ids)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.ownerId) query = query.where('ownerId', '==', filter.ownerId);
    return query;
  }

  private checkCycleOverlap(existingCycles: Cycle[], newCycle: Cycle) {
    const overlap = existingCycles.some(
      (cycle) =>
        this.commonService.date.isBefore(newCycle.from, cycle.to) &&
        this.commonService.date.isAfter(newCycle.to, cycle.from),
    );

    if (overlap) throw new BadRequestException('Cycle overlap');
  }

  private async validateMembers(membersIds: string[]) {
    const members = await this.userService.findAllOrFail({ ids: membersIds });

    if (members.length < 1)
      throw new BadRequestException('Group must have at least one member');

    if (members.length !== membersIds.length)
      throw new BadRequestException('Invalid members provided');

    return members;
  }
}
