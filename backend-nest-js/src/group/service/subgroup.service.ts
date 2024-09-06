import { BadRequestException, forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { SubgroupRepository } from '../repository/subgroup.repository';
import { GroupRef, SubgroupRef } from '../../common/type/firebase-firestore.type';
import { User } from '../../common/type/firebase-auth.type';
import { GroupService } from './group.service';
import { Wrapper } from '../../common/type/wrapper.type';
import { Subgroup } from '../entity/subgroup.entity';
import { Filter, FindManyOptions, FindOneOptions, PaginateOptions, Populate } from '../../common/type/orm.type';
import { Query, Timestamp } from 'firebase-admin/firestore';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { CommonService } from '../../common/service/common.service';
import { CanViewService } from '../../common/type/auth.type';

@Injectable()
export class SubgroupService extends CanViewService<SubgroupRef> {
  private logger = new Logger(SubgroupService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly userService: UserService,
    private readonly subgroupRepository: SubgroupRepository,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: Wrapper<GroupService>,
  ) {
    super();
  }

  async canView(user: User, ref: Required<SubgroupRef>): Promise<boolean> {
    const subgroup = await this.subgroupRepository.getDoc(ref);
    const canViewGroup = await this.groupService.canView(user, ref);
    if (!canViewGroup || !subgroup.membersIds.includes(user.uid)) return false;
    return true;
  }

  async authorize(user: User, ref: Required<SubgroupRef>): Promise<void> {
    const permitted = await this.canView(user, ref);
    if (!permitted) throw new UnauthorizedException('You cannot view this subgroup');
  }

  async findSubgroups(ref: Required<GroupRef>, options?: FindManyOptions<Subgroup>): Promise<Subgroup[]> {
    return await this.subgroupRepository.getDocs(ref, (collection) => {
      let query = collection;
      if (options.filter) query = this.filter(query, options.filter);
      if (options.paginate) query = this.paginate(query, options.paginate);

      return query;
    });
  }

  async findUserSubgroups(user: User, ref: Required<SubgroupRef>, options?: FindManyOptions<Subgroup>): Promise<Subgroup[]> {
    await this.authorize(user, ref);
    return await this.findSubgroups(ref, options);
  }

  /**
   * All subgroups have `from` and `to` dates which define the active period of
   * the subgroup. To get all active subgroups, we need to filter the subgroups
   * where today's date is between `from` and `to`.
   */
  async findActiveSubgroups(ref: Required<GroupRef>, options?: FindManyOptions<Subgroup>): Promise<Subgroup[]> {
    return await this.findSubgroups(ref, {
      ...options,
      filter: {
        ...options.filter,
        from: { op: '>=', value: new Date() },
        to: { op: '<=', value: new Date() },
      },
    });
  }

  async findSubgroup(ref: Required<SubgroupRef>, options?: FindOneOptions<Subgroup>): Promise<Subgroup> {
    const subgroup = await this.subgroupRepository.getDoc(ref);
    if (!subgroup) return null;

    if (options.populate) await this.populate(ref, subgroup, options.populate);
    return subgroup;
  }

  async findSubgroupOrFail(ref: Required<SubgroupRef>, options?: FindOneOptions<Subgroup>): Promise<Subgroup> {
    const subgroup = await this.findSubgroup(ref, options);
    if (!subgroup) throw new BadRequestException('Subgroup not found');
    return subgroup;
  }

  async findUserSubgroupOrFail(user: User, ref: Required<SubgroupRef>, options?: FindOneOptions<Subgroup>): Promise<Subgroup> {
    await this.authorize(user, ref);
    return await this.findSubgroupOrFail(ref, options);
  }

  async create(ref: Required<GroupRef>, input: Partial<Subgroup>): Promise<Subgroup> {
    const group = await this.groupService.findGroupOrFail(ref);

    // validate data
    const membersIds = await this.findAvailableMembers(ref);
    if (!group.membersIds.every(memberId => membersIds.includes(memberId)))
      throw new BadRequestException('All members must be available in the parent group');

    // create subgroup
    const data = {
      name: input.name,
      cycleId: input.cycleId,
      membersIds,
      from: input.from,
      to: input.to,
    };

    const subgroupId = await this.subgroupRepository.addDoc(ref, data);
    return {
      id: subgroupId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
    };
  }

  private filter(query: Query, filter: Filter<Subgroup>): Query {
    if (filter.ids) query = query.where('id', 'in', filter.ids);
    if (filter.membersIds) query = query.where('membersIds', 'array-contains-any', filter.membersIds);
    if (filter.name) query = query.where('name', '>=', filter.name.value).where('name', '<=', filter.name.value + '\uf8ff');
    if (filter.from) query = query.where('from', filter.from.op || '>=', Timestamp.fromDate(filter.from.value));
    if (filter.to) query = query.where('to', filter.to.op || '<=', Timestamp.fromDate(filter.to.value));

    return query;
  }

  private paginate(query: Query, paginate: PaginateOptions<Subgroup>): Query {
    const orderBy = paginate.orderBy || { field: 'from', value: 'desc' };
    const page = paginate.page || 1;
    const pageSize = paginate.pageSize || DEFAULT_PAGE_SIZE;

    return query
      .orderBy(orderBy.field, orderBy.value)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  }

  private async populate(ref: Required<SubgroupRef>, subgroup: Subgroup, populate: Populate<Subgroup>[]): Promise<Subgroup> {
    if (populate.includes('members'))
      subgroup.members = await this.userService.findAll({ ids: subgroup.membersIds });

    return subgroup;
  }

  /**
   * Finds all available members for a group. First, all active subgroups and
   * their members are found, then only unique values are found, and finally,
   * the result is subtracted from all group members to get the available
   * members.
   *
   * Formula: (all group members - union of all members in subgroups)
   */
  private async findAvailableMembers(ref: Required<GroupRef>): Promise<string[]> {
    const group = await this.groupService.findGroupOrFail(ref);

    // get all active subgroups
    const subgroups = await this.findActiveSubgroups(ref);

    // unavailable members are all members of active subgroups
    const unavailable = this.commonService.array.unique(subgroups.flatMap(subgroup => subgroup.membersIds));

    // group members - unavailable members = available members
    return group.membersIds.filter(member => !unavailable.includes(member));
  }
}