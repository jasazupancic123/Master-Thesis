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
import { Subgroup } from '../entity/subgroup.entity';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
  Populate,
} from '../../common/type/orm.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { CycleRef, GroupRef } from '../../common/type/firebase-firestore.type';
import { GroupRepository } from '../repository/group.repository';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { SubgroupService } from './subgroup.service';
import { CreateGroup, UpdateGroup } from '../type/group.type';
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { endOfDay, startOfDay } from 'date-fns';
import { CreateCycle, UpdateCycle } from '../type/cycle.type';
import { Cycle } from '../entity/cycle.entity';

@Injectable()
export class GroupService {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly subgroupService: SubgroupService,
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

  isOwner(userId: string, group: Group): boolean {
    return group.ownerId === userId;
  }

  async findAll(
    options?: FindManyOptions<Group> & { user?: User },
  ): Promise<Group[]> {
    const user = options?.user;
    if (!user) throw new BadRequestException('User not provided');

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

    if (options?.populate)
      await Promise.all(
        groups.map((group) =>
          this.populate({ groupId: group.id }, group, options.populate),
        ),
      );

    return groups;
  }

  async findOne(
    ref: Required<GroupRef>,
    options?: FindOneOptions<Group> & { user?: User },
  ): Promise<Group | null> {
    // find group
    const group = await this.groupRepository.getDoc(ref.groupId);
    if (!group || group.deletedAt) return null;

    // authorize
    if (options?.user && !this.isAuthorized(options.user, group)) return null;

    // populate
    if (options?.populate) await this.populate(ref, group, options.populate);

    return group;
  }

  async findOneOrFail(
    ref: Required<GroupRef>,
    options?: FindOneOptions<Group> & { user?: User },
  ): Promise<Group> {
    const group = await this.findOne(ref, options);
    if (!group) throw new BadRequestException('Group not found');
    return group;
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

  async create(user: User, input: CreateGroup): Promise<Group> {
    this.logger.log(
      `User ${user.uid} is creating group: ${JSON.stringify(input)}`,
    );

    // validate members
    const members = await this.validateMembers(input.membersIds);
    const membersIds = members.map((member) => member.uid);

    // create group
    const groupId = await this.groupRepository.addDoc({
      ownerId: user.uid,
      name: input.name,
      membersIds,
    });

    // for each user, add group to user's groupsIds
    await Promise.all(
      members.map((member) => this.userService.addGroup(member.uid, groupId)),
    );

    return {
      id: groupId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: user.uid,
      name: input.name,
      membersIds,
      availableMembersIds: [],
      members,
      subgroups: [],
      cycles: [],
    };
  }

  async update(
    ref: Required<GroupRef>,
    input: UpdateGroup,
    options: { user: User },
  ): Promise<Group> {
    // find parent references
    const group = await this.findOneOrFail(ref, options);
    const { user } = options;

    this.logger.log(
      `User ${user.uid} is updating group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    if (input.membersIds) {
      // update members for all trainings in the parent group
      const trainings = await this.trainingService.findAll({
        user,
        filter: {
          groupId: { value: group.id },
          // subgroupId: { value: null },
        },
      });

      await Promise.all(
        trainings.map((training) =>
          this.trainingService.update(
            { trainingId: training.id },
            { membersIds: input.membersIds },
            { user },
          ),
        ),
      );
    }

    // update group
    await this.groupRepository.updateDoc(ref.groupId, input);

    return await this.findOneOrFail(ref, {
      user,
      populate: ['members', 'availableMembersIds', 'cycles', 'subgroups'],
    });
  }

  /**
   * Soft deletes a group by setting the deletedAt field to the current date.
   */
  async remove(
    ref: Required<GroupRef>,
    options: { user: User },
  ): Promise<void> {
    const { user } = options;
    this.logger.debug(`User ${user.uid} is removing group ${ref.groupId}`);
    const group = await this.findOneOrFail(ref);

    // delete all subgroups
    /* const subgroups = await this.subgroupService.findAll(ref);

    await Promise.all(
      subgroups.map((subgroup) =>
        this.subgroupService.remove(
          { groupId: ref.groupId, subgroupId: subgroup.id },
          options,
        ),
      ),
    ); */

    // TODO - delete all trainings
    /* const trainings = await this.trainingService.findAll({
      user,
      filter: { groupId: { value: ref.groupId } },
    });

    await Promise.all(
      trainings.map((training) =>
        this.trainingService.remove({ trainingId: training.id }, options),
      ),
    ); */

    // remove group from all members
    await Promise.all(
      group.membersIds.map((memberId) =>
        this.userService.removeGroup(memberId, ref.groupId),
      ),
    );

    // remove group from owner
    await this.userService.removeGroup(group.ownerId, ref.groupId);

    // soft delete group
    await this.groupRepository.deleteDoc(ref.groupId);
  }

  async addCycle(
    ref: Required<GroupRef>,
    user: User,
    input: CreateCycle,
  ): Promise<Cycle> {
    this.logger.log(
      `User ${user.uid} adding cycle to group ${ref.groupId}: ${JSON.stringify(input)}`,
    );
    const group = await this.findOneOrFail(ref, { user });

    // check that current group cycles don't overlap with the new one
    if (this.isOverlappingCycle(group.cycles, input as Cycle))
      throw new BadRequestException('Cycle overlap');

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
    ref: Required<CycleRef>,
    user: User,
    cycleId: string,
    input: UpdateCycle,
  ): Promise<Cycle> {
    this.logger.log(
      `User ${user.uid} updating cycle ${ref.cycleId}: ${JSON.stringify(input)}`,
    );

    const group = await this.findOneOrFail(ref, { user });
    const cycle = group.cycles.find((cycle) => cycle.id === cycleId);
    if (!cycle) throw new BadRequestException('Cycle does not exist');

    const update = this.commonService.object.clean(input);

    // check that current group cycles don't overlap with the new one
    update.from = input.from || cycle.from;
    update.to = input.to || cycle.to;

    if (
      this.isOverlappingCycle(
        group.cycles.filter((c) => c.id !== cycle.id),
        update as Cycle,
      )
    )
      throw new BadRequestException('Cycle overlap');

    await this.groupRepository.updateCycle(group.id, cycleId, update);
    return { ...cycle, ...update };
  }

  async deleteCycle(ref: Required<CycleRef>, user: User) {
    this.logger.log(`User ${user.uid} removing cycle ${ref.cycleId}:}`);

    const group = await this.findOneOrFail(ref, { user });
    const cycle = group.cycles.find((cycle) => cycle.id === ref.cycleId);
    if (!cycle) throw new BadRequestException('Cycle does not exist');

    await this.groupRepository.deleteCycle(ref.groupId, ref.cycleId);
  }

  /**
   * Finds all available members for a group for the current day.
   */
  async findAvailableMembers(
    ref: Required<GroupRef>,
    date: Date,
    options?: { user?: User },
  ): Promise<string[]> {
    const group = await this.findOneOrFail(ref, options);
    const subgroups = await this.subgroupService.findAll(ref, {
      user: options?.user,
      filter: {
        groupId: { value: ref.groupId },
        from: { value: startOfDay(date), op: '<=' },
        to: { value: endOfDay(date), op: '>=' },
      },
    });

    // find all active subgroups for the provided date
    const activeSubgroups = subgroups.filter((subgroup) =>
      this.commonService.date.isBetween(date, subgroup.from, subgroup.to),
    );

    // members that are part of active subgroups are not available
    const unavailableMembers = activeSubgroups.flatMap(
      (subgroup) => subgroup.membersIds,
    );

    // return unique(all members - unavailableMembers)
    const availableMembers = group.membersIds.filter(
      (memberId) => !unavailableMembers.includes(memberId),
    );

    return this.commonService.array.unique(availableMembers);
  }

  private async validateMembers(membersIds: string[]) {
    const members = await this.userService.findAllOrFail({ ids: membersIds });

    if (members.length < 1)
      throw new BadRequestException('Group must have at least one member');

    if (members.length !== membersIds.length)
      throw new BadRequestException('Invalid members provided');

    return members;
  }

  private filter(query: Query, filter: Filter<Group>) {
    if (filter.ids)
      query = query.where(FieldPath.documentId(), 'in', filter.ids);

    if (filter.ownerId) query = query.where('ownerId', '==', filter.ownerId);

    if (filter.name)
      query = query
        .where('name', '>=', filter.name)
        .where('name', '<=', filter.name + '\uf8ff');

    if (filter.createdAt)
      query = query.where(
        'createdAt',
        filter.createdAt.op || '>=',
        Timestamp.fromDate(filter.createdAt.value),
      );

    if (filter.updatedAt)
      query = query.where(
        'updatedAt',
        filter.updatedAt.op || '>=',
        Timestamp.fromDate(filter.updatedAt.value),
      );

    return query;
  }

  private isOverlappingCycle(
    existingCycles: Cycle[],
    newCycle: Cycle,
  ): boolean {
    return existingCycles.some(
      (cycle) =>
        this.commonService.date.isBefore(newCycle.from, cycle.to) &&
        this.commonService.date.isAfter(newCycle.to, cycle.from),
    );
  }

  private paginate(query: Query, paginate: PaginateOptions<Group>): Query {
    const orderBy = paginate.orderBy || { field: 'createdAt', value: 'desc' };
    const page = paginate.page || 1;
    const pageSize = paginate.pageSize || DEFAULT_PAGE_SIZE;

    return query
      .orderBy(orderBy.field, orderBy.value)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  }

  private async populate(
    ref: Required<GroupRef>,
    group: Group,
    populate: Populate<Group>[],
  ) {
    if (populate.includes('members'))
      group.members = await this.userService.findAll({ ids: group.membersIds });

    if (populate.includes('availableMembersIds'))
      group.availableMembersIds = await this.findAvailableMembers(
        ref,
        startOfDay(new Date()),
      );

    if (populate.includes('subgroups')) {
      group.subgroups = await this.subgroupService.findAllActive(
        ref,
        startOfDay(new Date()),
      );

      if (populate.includes('subgroups.members')) {
        if (!populate.includes('members'))
          throw new Error(
            'Cannot populate subgroup members without populating group members',
          );

        for (const subgroup of group.subgroups)
          subgroup.members = group.members.filter((member) =>
            subgroup.membersIds.includes(member.uid),
          );
      }
    }
  }
}
