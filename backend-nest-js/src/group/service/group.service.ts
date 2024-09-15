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
import { Cycle } from '../entity/cycle.entity';
import {
  Filter,
  FindManyOptions,
  FindOneOptions,
  PaginateOptions,
  Populate,
} from '../../common/type/orm.type';
import { Wrapper } from '../../common/type/wrapper.type';
import { GroupRef, UserRef } from '../../common/type/firebase-firestore.type';
import { GroupRepository } from '../repository/group.repository';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { CycleRepository } from '../repository/cycle.repository';
import { CycleService } from './cycle.service';
import { SubgroupService } from './subgroup.service';
import { UserRepository } from '../../user/repository/user.repository';
import { CreateGroup } from '../type/group.type';
import { CreateSubgroup } from '../type/subgroup.type';
import { CreateCycle } from '../type/cycle.type';
import { endOfDay, startOfDay } from 'date-fns';

@Injectable()
export class GroupService {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly groupRepository: GroupRepository,
    private readonly cycleRepository: CycleRepository,
    private readonly cycleService: CycleService,
    private readonly subgroupService: SubgroupService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
  ) {}

  canView(ref: Required<UserRef>, group: Group): boolean {
    return this.isMember(ref.uid, group) || this.isOwner(ref.uid, group);
  }

  isMember(userId: string, group: Group | Subgroup): boolean {
    return group.membersIds.includes(userId);
  }

  isOwner(userId: string, group: Group): boolean {
    return group.ownerId === userId;
  }

  async findAllByOwner(
    userId: string,
    options?: FindManyOptions<Group>,
  ): Promise<Group[]> {
    // find parent references
    await this.userService.findOneOrFail(userId);

    return await this.groupRepository.getDocs({ uid: userId }, (collection) => {
      let query = collection.where('ownerId', '==', userId);
      if (options?.filter) query = this.filter(query, options.filter);
      if (options?.paginate) query = this.paginate(query, options.paginate);

      return query;
    });
  }

  async findAllByMember(
    userId: string,
    options?: FindManyOptions<Group> & { active?: boolean },
  ): Promise<Group[]> {
    let query = this.userRepository
      .collectionGroup('groups')
      .where('membersIds', 'array-contains', userId);

    if (options?.active)
      query = query
        .where('from', '<=', Timestamp.now())
        .where('to', '>=', Timestamp.now());

    if (options?.filter) query = this.filter(query, options.filter);

    const groups = await query
      .orderBy('from', 'desc')
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) => this.groupRepository.serialize(doc)),
      );

    if (options?.populate)
      await Promise.all(
        groups.map((group) => {
          const ref = { uid: group.ownerId, groupId: group.id };
          return this.populate(ref, group, options.populate);
        }),
      );

    return groups;
  }

  async findOne(
    ref: Required<GroupRef>,
    options?: FindOneOptions<Group> & { authorize?: boolean },
  ): Promise<Group | null> {
    // find parent references
    await this.userService.findOneOrFail(ref.uid);

    // find group
    const group = await this.groupRepository.getDoc(ref);
    if (!group) return null;

    // authorize
    if (options?.authorize && !this.canView(ref, group)) return null;

    if (options?.populate) await this.populate(ref, group, options.populate);
    return group;
  }

  async findOneOrFail(
    ref: Required<GroupRef>,
    options?: FindOneOptions<Group> & { authorize?: boolean },
  ): Promise<Group> {
    const group = await this.findOne(ref, options);
    if (!group) throw new BadRequestException('Group not found');
    return group;
  }

  async create(ref: Required<UserRef>, input: CreateGroup): Promise<Group> {
    // find parent references
    await this.userService.findOneOrFail(ref.uid);

    this.logger.debug(
      `User ${ref.uid} is creating group: ${JSON.stringify(input)}`,
    );

    // TODO - allow only 10 groups per user for free plan?

    // validate members
    const members = await this.validateMembers(input.membersIds);

    // create group
    const data = {
      ownerId: ref.uid,
      name: input.name,
      membersIds: input.membersIds,
    };

    const groupId = await this.groupRepository.addDoc(ref, data);

    return {
      id: groupId,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: input.name,
      ownerId: ref.uid,
      owner: null,
      membersIds: input.membersIds,
      availableMembersIds: input.membersIds,
      members,
      subgroups: [],
      cycles: [],
    };
  }

  async addSubgroup(
    ref: Required<GroupRef>,
    input: CreateSubgroup,
  ): Promise<Subgroup> {
    this.logger.debug(
      `Adding subgroup (user ${ref.uid}) for group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    // find parent references
    const cycle = await this.cycleService.findOneOrFail({
      ...ref,
      cycleId: input.cycleId,
    });

    // validate dates
    if (
      !this.commonService.date.isBetween(input.from, cycle.from, cycle.to) ||
      !this.commonService.date.isBetween(input.to, cycle.from, cycle.to)
    )
      throw new BadRequestException(
        'Subgroup dates must be within the cycle dates',
      );

    // validate members
    const members = await this.validateMembers(input.membersIds);

    const subgroup = await this.subgroupService.create(ref, {
      name: input.name,
      cycleId: input.cycleId,
      membersIds: members.map((member) => member.uid),
      from: input.from,
      to: input.to,
    });

    // copy trainings from cycle to subgroup
    const trainings = await this.trainingService.findAll(
      {
        ...ref,
        cycleId: input.cycleId,
      },
      {
        authorize: false,
        filter: {
          subgroupId: { value: null },
          from: { op: '>=', value: startOfDay(input.from) },
          to: { op: '<=', value: endOfDay(input.to) },
        },
      },
    ); // all parent group trainings

    for (const training of trainings) {
      const source = {
        uid: ref.uid,
        groupId: ref.groupId,
        cycleId: cycle.id,
        subgroupId: null,
        trainingId: training.id,
      };

      const destination = {
        uid: ref.uid,
        groupId: ref.groupId,
        cycleId: cycle.id,
        subgroupId: subgroup.id,
      };

      await this.trainingService.copy(source, destination);
    }

    // populate subgroup
    subgroup.members = members;
    return subgroup;
  }

  async addCycle(ref: Required<GroupRef>, input: CreateCycle): Promise<Cycle> {
    this.logger.debug(
      `Adding cycle (user ${ref.uid}) for group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    return await this.cycleService.create(ref, input);
  }

  /**
   * Finds all available members for a group. First, all active subgroups and
   * their members are found, then only unique values are found, and finally,
   * the result is subtracted from all group members to get the available
   * members.
   *
   * Formula: (all group members - union of all members in active subgroups)
   */
  async findAvailableMembers(ref: Required<GroupRef>): Promise<string[]> {
    const group = await this.findOneOrFail(ref);

    // get all active subgroups
    const subgroups = await this.subgroupService.findAllActive(ref);

    // unavailable members are all members of active subgroups
    const unavailableMembers = subgroups.flatMap(
      (subgroup) => subgroup.membersIds,
    );

    const uniqueUnavailableMembers =
      this.commonService.array.unique(unavailableMembers);

    // group members - unavailable members = available members
    return group.membersIds.filter(
      (memberId) => !uniqueUnavailableMembers.includes(memberId),
    );
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
    if (populate.includes('owner'))
      group.owner = await this.userService.findOneBy('id', group.ownerId);

    if (populate.includes('members'))
      group.members = await this.userService.findAll({ ids: group.membersIds });

    if (populate.includes('availableMembersIds'))
      group.availableMembersIds = await this.findAvailableMembers(ref);

    if (populate.includes('subgroups')) {
      group.subgroups = await this.subgroupService.findAllActive(ref);

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

    if (populate.includes('cycles')) {
      group.cycles = await this.cycleRepository.getDocs(ref);

      if (populate.includes('cycles.trainings')) {
        for (const cycle of group.cycles)
          cycle.trainings = await this.trainingService.findAll({
            ...ref,
            cycleId: cycle.id,
          });
      }
    }
  }
}
