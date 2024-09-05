import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Group } from '../entity/group.entity';
import { User } from '../../common/type/firebase-auth.type';
import { UserService } from '../../user/user.service';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { TrainingService } from '../../training/service/training.service';
import { CommonService } from '../../common/service/common.service';
import { Subgroup } from '../entity/subgroup.entity';
import { IdDto } from '../../common/dto/id.dto';
import { Cycle } from '../entity/cycle.entity';
import { Filter, FindManyOptions, FindOneOptions, PaginateOptions, Populate } from '../../common/type/orm.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { GroupRef } from '../../common/type/firebase-firestore.type';
import { GroupRepository } from '../repository/group.repository';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { SubgroupRepository } from '../repository/subgroup.repository';
import { CycleRepository } from '../repository/cycle.repository';
import { CycleService } from './cycle.service';
import { SubgroupService } from './subgroup.service';
import { CanViewService } from '../../common/type/auth.type';

@Injectable()
export class GroupService extends CanViewService<GroupRef> {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly userService: UserService,
    private readonly groupRepository: GroupRepository,
    private readonly subgroupRepository: SubgroupRepository,
    private readonly cycleRepository: CycleRepository,
    private readonly cycleService: CycleService,
    private readonly subgroupService: SubgroupService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
  ) {
    super();
  }

  async canView(user: User, ref: Required<GroupRef>): Promise<boolean> {
    const group = await this.findGroup(ref.groupId);
    if (!group) return false;
    return this.isMember(user, group) || this.isOwner(user, group);
  }

  isMember(user: User, group: Group | Subgroup): boolean {
    return group.membersIds.includes(user.uid);
  }

  isOwner(user: User, group: Group): boolean {
    return group.ownerId === user.uid;
  }

  async findGroupsByOwner(ownerId: string, options?: FindManyOptions<Group>): Promise<Group[]> {
    return await this.groupRepository.getDocs((collection) => {
      let query = collection.where('ownerId', '==', ownerId);
      if (options.filter) query = this.filter(query, options.filter);
      if (options.paginate) query = this.paginate(query, options.paginate);

      return query;
    });
  }

  async findGroupsByMember(memberId: string, options?: FindManyOptions<Group>): Promise<Group[]> {
    return await this.groupRepository.getDocs((collection) => {
      let query = collection.where('membersIds', 'array-contains', memberId);
      if (options.filter) query = this.filter(query, options.filter);
      if (options.paginate) query = this.paginate(query, options.paginate);

      return query;
    });
  }

  async findGroup(id: string, options?: FindOneOptions<Group>): Promise<Group | null> {
    const group = await this.groupRepository.getDoc(id);
    if (!group) return null;

    if (options?.populate) await this.populate(group, options.populate);
    return group;
  }

  async findGroupOrFail(id: string, options?: FindOneOptions<Group>): Promise<Group> {
    const group = await this.findGroup(id, options);
    if (!group) throw new BadRequestException('Group not found');
    return group;
  }

  /**
   * Returns a group by ID that user is permitted to view.
   */
  async findUserGroup(user: User, id: string, options?: FindOneOptions<Group>): Promise<Group | null> {
    const group = await this.findGroup(id, options);
    if (!group || !await this.canView(user, { groupId: id })) return null;
    return group;
  }

  /**
   * Returns a group by ID that user is permitted to view. Throws an error if
   * group is not found.
   */
  async findUserGroupOrFail(user: User, id: string, options?: FindOneOptions<Group>): Promise<Group> {
    const group = await this.findUserGroup(user, id, options);
    if (!group) throw new BadRequestException('Group not found');
    return group;
  }

  async createGroup(user: User, input: Partial<Group>): Promise<Group> {
    // TODO - allow only 10 groups per user for free plan?
    this.logger.debug(`User ${user.uid} is creating group: ${JSON.stringify(input)}`);

    // validate data
    const members = await this.userService.findAllOrFail({ ids: input.membersIds });
    if (members.length < 1) throw new BadRequestException('Group must have at least one member');

    // create group
    const data = { ownerId: user.uid, name: input.name, membersIds: members.map(member => member.uid) };
    const groupId = await this.groupRepository.addDoc(data);

    // populate group
    const group = await this.findGroup(groupId);
    group.owner = user;
    group.members = members;
    group.subgroups = [];
    group.cycles = [];

    return group;
  }

  async addSubgroup(user: User, ref: Required<GroupRef>, input: Partial<Subgroup> & IdDto): Promise<Subgroup> {
    this.logger.debug(`Adding subgroup (user ${user.uid}) for group ${input.id}: ${JSON.stringify(input)}`);
    await this.authorize(user, ref);

    // find parent references (group and cycle)
    const cycleRef = { groupId: ref.groupId, cycleId: input.cycleId, subgroupId: null };
    const cycle = await this.cycleService.findCycleOrFail(cycleRef);

    // validate dates
    if (
      !this.commonService.date.isBetween(input.from, cycle.from, cycle.to) ||
      !this.commonService.date.isBetween(input.to, cycle.from, cycle.to)
    )
      throw new BadRequestException('Subgroup dates must be within the cycle dates');

    // validate members
    const members = await this.userService.findAllOrFail({ ids: input.membersIds });
    if (members.length < 1) throw new BadRequestException('Subgroup must have at least one member');

    const subgroup = await this.subgroupService.create(ref, {
      name: input.name,
      cycleId: input.cycleId,
      membersIds: members.map(member => member.uid),
      from: input.from,
      to: input.to,
    });

    // TODO - copy trainings from cycle to subgroup
    /*for (constant training of [])
      await this.trainingService.copy(user, {
        trainingId: training.id,
        cycleId: 'cycleId',
        subgroupId: group.id,
      });*/

    // populate subgroup
    subgroup.members = members;

    return subgroup;
  }

  async addCycle(user: User, ref: Required<GroupRef>, input: Partial<Cycle>): Promise<Cycle> {
    this.logger.debug(`Adding cycle (user ${user.uid}) for group ${input.id}: ${JSON.stringify(input)}`);
    return await this.cycleService.create(ref, input);
  }

  private filter(query: Query, filter: Filter<Group>) {
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

  private async populate(group: Group, populate: Populate<Group>[]) {
    if (populate.includes('owner'))
      group.owner = await this.userService.findOneBy('id', group.ownerId);

    if (populate.includes('members'))
      group.members = await this.userService.findAll({ ids: group.membersIds });

    if (populate.includes('subgroups')) {
      group.subgroups = await this.subgroupRepository.getDocs({ groupId: group.id });

      if (populate.includes('subgroups.members')) {
        if (!populate.includes('members'))
          throw new Error('Cannot populate subgroup members without populating group members');

        for (const subgroup of group.subgroups)
          subgroup.members = group.members.filter(member => subgroup.membersIds.includes(member.uid));
      }
    }

    if (populate.includes('cycles')) {
      group.cycles = await this.cycleRepository.getDocs({ groupId: group.id });

      if (populate.includes('cycles.trainings')) {
        for (const cycle of group.cycles)
          cycle.trainings = await this.trainingService.findTrainings({
            groupId: group.id,
            cycleId: cycle.id,
            subgroupId: null,
          });
      }
    }
  }
}
