import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Group } from './entity/group.entity';
import { User } from '../common/type/firebase-auth.type';
import { UserService } from '../user/user.service';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { TrainingService } from '../training/training.service';
import { CommonService } from '../common/service/common.service';
import { Subgroup } from './entity/subgroup.entity';
import { IdDto } from '../common/dto/id.dto';
import { FirestoreCollection } from '../common/enum/firestore-collection.enum';
import { Cycle } from './entity/cycle.entity';
import { isAfter, isBefore } from 'date-fns';
import { Filter, FindManyOptions, PaginateOptions } from '../common/type/orm.type';
import { Wrapper } from '../common/type/wrapper.type';
import { GroupRef, RootRef } from '../common/type/firebase-firestore.type';
import { GroupRepository } from './repository/group.repository';
import { DEFAULT_PAGE_SIZE } from '../common/constant/pagination.constant';

@Injectable()
export class GroupService {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
    private readonly repository: GroupRepository,
    @Inject(forwardRef(() => TrainingService))
    readonly trainingService: Wrapper<TrainingService>,
  ) {
  }

  async findGroups(ref: Required<RootRef>, options?: FindManyOptions<Group>): Promise<Group[]> {
  }

  /**
   * Returns all groups that user is member or owner of
   */
  async findUserGroups(user: User) {
    const owned = await this.repository.findAllBy({ field: 'ownerId', value: user.uid });
    const member = await this.repository.findAllBy({
      field: 'membersIds',
      operator: 'array-contains',
      value: user.uid,
    });

    return this.commonService.array.unique(owned.concat(member)); // just in case
  }

  async findMembers(group: Group): Promise<User[]> {
    return this.userService.findAll({ ids: group.membersIds });
  }

  /**
   * Checks if user is owner or a member of the group and returns the group or
   * throws an error. It also updates the group with newly available members.
   */
  async findOneByIdOrFail(user: User, id: string): Promise<Group> {
    const group = await this.repository.findOneByIdOrFail(id);

    // check permissions
    if (!this.canView(user, group))
      throw new BadRequestException('You are not a member of this group');

    // populate
    group.user = await this.userService.findOneBy(group.ownerId);
    group.members = await this.findMembers(user, group);
    group.subgroups = await this.findSubgroups(user, { groupId: group.id });
    return group;
  }

  async findCycleByIdOrFail(user: User, ref: GroupRef): Promise<Cycle> {
    if (!ref.cycleId)
      throw new BadRequestException('Cycle ID is required');

    const cycle = this.firebaseService.serializeDocument<Cycle>(await this.collection.cycle(ref).get());
    if (!cycle)
      throw new BadRequestException('Cycle not found');

    // populate
    cycle.trainings = await this.trainingService.findTrainings(ref);
    cycle.weeks = this.commonService.date.weeks(cycle.from, cycle.to);
    return cycle;
  }

  async findUserCycleOrFail(user: User, ref: GroupRef): Promise<Cycle> {
    // check if user is a member of the group
    await this.findOneByIdOrFail(user, ref.groupId);

    const cycle = this.firebaseService.serializeDocument<Cycle>(await this.collection.cycle(ref).get());
    if (!cycle)
      throw new BadRequestException('Cycle not found');

    // populate
    cycle.weeks = this.commonService.date.weeks(cycle.from, cycle.to);
    return cycle;
  }

  /**
   * There is no overlap between cycles, so only one cycle can be active at a
   * time. This function returns the active cycle for the given date. By
   * default, it uses the current date.
   */
  async findActiveCycle(user: User, ref: GroupRef, date: Date = new Date()): Promise<Cycle | null> {
    const cycles = await this.findAllCycles(user, ref, { from: date });
    return cycles.find(cycle => isBefore(date, cycle.to));
  }

  /**
   * Returns all groups that user is member of.
   */
  async findAthleteGroups(_user: User) {
    return [];
  }

  async findAllCycles(user: User, ref: GroupRef, filter?: Filter<Cycle>): Promise<Cycle[]> {
    await this.findOneByIdOrFail(user, ref.groupId);

    let query = this.collection.cycles(ref) as Query;
    if (filter) {
      if (filter.ids) query = query.where('id', 'in', filter.ids);
      if (filter.from) query = query.where('from', '>=', Timestamp.fromDate(<Date>filter.from));
      if (filter.to) query = query.where('to', '<=', Timestamp.fromDate(<Date>filter.to));
    }

    const cycles = this.firebaseService.serialize<Cycle>(await query.get());
    for (const cycle of cycles) {
      cycle.trainings = [];
      cycle.weeks = [];
    }

    return cycles;
  }

  async findSubgroupOrFail(user: User, ref: GroupRef): Promise<Subgroup> {
    const subgroup = this.firebaseService.serializeDocument<Subgroup>(await this.collection.subgroup(ref).get());
    if (!subgroup)
      throw new BadRequestException('Subgroup not found');

    // populate
    subgroup.members = await this.userService.findAll(user, { ids: subgroup.membersIds });
    return subgroup;
  }

  async findSubgroups(user: User, ref: GroupRef, filter?: Filter<Subgroup>): Promise<Subgroup[]> {
    await this.findOneByIdOrFail(user, ref.groupId);

    let query = this.collection.subgroups(ref) as Query;
    if (filter) {
      if (filter.ids) query = query.where('id', 'in', filter.ids);
      if (filter.from) query = query.where('from', '>=', Timestamp.fromDate(<Date>filter.from));
      if (filter.to) query = query.where('to', '<=', Timestamp.fromDate(<Date>filter.to));
    }

    const subgroups = this.firebaseService.serialize<Subgroup>(await query.get());
    for (const subgroup of subgroups)
      subgroup.members = await this.userService.findAll(user, { ids: subgroup.membersIds });

    return subgroups;
  }

  async createGroup(user: User, data: Partial<Group>): Promise<Group> {
    // TODO - allow only 10 groups per user for free plan?
    this.logger.debug(`User ${user.uid} is creating group: ${JSON.stringify(data)}`);

    // validate
    const members = await this.userService.findAllOrFail(user, { ids: data.membersIds });
    if (members.length < 1) throw new BadRequestException('Group must have at least one member');

    // create
    const group = await this.repository.create({
      ownerId: user.uid,
      name: data.name,
      membersIds: members.map(member => member.uid),
    });

    // populate
    group.user = user;
    group.members = members;
    group.subgroups = [];
    group.cycles = [];

    return group;
  }

  async addSubgroup(user: User, data: Partial<Subgroup> & IdDto): Promise<Subgroup> {
    // check permissions
    const group = await this.repository.findOneByIdOrFail(data.id); // parent group
    if (!this.isOwner(user, group))
      throw new BadRequestException('You are not allowed to create subgroups for this group');

    // validate dates
    const ref: GroupRef = { groupId: group.id, cycleId: data.cycleId };
    const { from, to } = this.firebaseService.serializeDocument<Cycle>(await this.collection.cycle(ref).get());
    if (isBefore(data.from, from) || isAfter(data.to, to))
      throw new BadRequestException('Subgroup dates must be within the cycle dates');

    // find all available members
    const members = await this.userService.findAllOrFail(user, { ids: data.membersIds });
    const availableMemberIds = await this.findAvailableMembers(group);

    // validate members
    if (members.length < 1) throw new BadRequestException('Subgroup must have at least one member');
    if (!members.every(member => availableMemberIds.includes(member.uid)))
      throw new BadRequestException('All members must be available in the parent group');

    const document = await this.collection.subgroups(ref).add({
      name: data.name,
      cycleId: data.cycleId,
      membersIds: members.map(member => member.uid),
      from: Timestamp.fromDate(data.from),
      to: Timestamp.fromDate(data.to),
    });

    const subgroup = this.firebaseService.serializeDocument<Subgroup>(await document.get());
    /*for (constant training of []) // TODO - copy trainings from cycle
      await this.trainingService.copy(user, {
        trainingId: training.id,
        cycleId: 'cycleId',
        subgroupId: group.id,
      });*/

    subgroup.members = members;
    return subgroup;
  }

  async addCycle(user: User, data: Partial<Cycle> & IdDto): Promise<Cycle> {
    this.logger.debug(`Adding cycle (user ${user.uid}) for group ${data.id}: ${JSON.stringify(data)}`);

    // check permissions
    const ref: GroupRef = { groupId: data.id };
    const group = await this.repository.findOneByIdOrFail(data.id);
    if (!this.isOwner(user, group)) throw new BadRequestException('You are not allowed to add cycles to this group');

    // validate dates
    const cycles = await this.findAllCycles(user, { groupId: group.id });
    if (cycles.some(cycle => this.commonService.date.isBetween(data.from, cycle.from, cycle.to)))
      throw new BadRequestException('Cycle dates must not overlap with existing cycles');

    // create cycle
    const item = await this.collection.cycles(ref).add({
      name: data.name,
      from: Timestamp.fromDate(data.from),
      to: Timestamp.fromDate(data.to),
    });

    // populate
    const cycle = this.firebaseService.serializeDocument<Cycle>(await item.get());
    cycle.trainings = [];
    cycle.weeks = [];

    return cycle;
  }

  /**
   * Finds all available members for a group. First, all active subgroups and
   * their members are found, then only unique values are found, and finally,
   * the result is subtracted from all group members to get the available
   * members.
   *
   * Formula: (all group members - union of all members in subgroups)
   */
  async findAvailableMembers(group: Group): Promise<string[]> {
    // find all active subgroups
    const subgroupCollection = this.repository.getCollection(group.id, FirestoreCollection.SUBGROUP);
    const subgroups = this.firebaseService.serialize<Subgroup>(await subgroupCollection.where('to', '<', Timestamp.now()).get());

    // get available members
    const unavailable = this.commonService.array.unique(subgroups.flatMap(subgroup => subgroup.membersIds));
    return group.membersIds.filter(id => !unavailable.includes(id));
  }

  canView(user: User, group: Group): boolean {
    return this.isMember(user, group) || this.isOwner(user, group);
  }

  isMember(user: User, group: Group | Subgroup): boolean {
    return group.membersIds.includes(user.uid);
  }

  isOwner(user: User, group: Group): boolean {
    return group.ownerId === user.uid;
  }

  private filter(query: Query, filter?: Filter<Group>) {
    if (!filter) return query;

    if (filter.ids) query = query.where('id', 'in', filter.ids);
    if (filter.ownerId) query = query.where('ownerId', '==', filter.ownerId);
    if (filter.name) query = query.where('name', '>=', filter.name).where('name', '<=', filter.name + '\uf8ff');
    if (filter.createdAt) query = query.where('createdAt', filter.createdAt.op || '>=', Timestamp.fromDate(filter.createdAt.value));
    if (filter.updatedAt) query = query.where('updatedAt', filter.updatedAt.op || '>=', Timestamp.fromDate(filter.updatedAt.value));

    return query;
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
}
