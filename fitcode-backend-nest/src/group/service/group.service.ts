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
import { GroupRef } from '../../common/type/firebase-firestore.type';
import { GroupRepository } from '../repository/group.repository';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { CycleService } from './cycle.service';
import { SubgroupService } from './subgroup.service';
import { CreateGroup, UpdateGroup } from '../type/group.type';
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { endOfDay, startOfDay } from 'date-fns';

@Injectable()
export class GroupService {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
    private readonly cycleService: CycleService,
    private readonly subgroupService: SubgroupService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
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

    const isTrainer = this.firebaseService.isTrainer(user);
    const isAthlete = this.firebaseService.isAthlete(user);

    const groups = await this.groupRepository.getDocs((collection) => {
      let query = isTrainer
        ? collection.where('ownerId', '==', user.uid)
        : isAthlete
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

  async create(user: User, input: CreateGroup): Promise<Group> {
    this.logger.debug(
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
      owner: null,
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

    this.logger.debug(
      `User ${user.uid} is updating group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    if (input.membersIds) {
      // update members for all trainings in the parent group
      const trainings = await this.trainingService.findAll({
        user,
        filter: {
          groupId: { value: group.id },
          subgroupId: { value: null },
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

      // update all cycle members
      const cycles = await this.cycleService.findAll(ref, {
        user,
        filter: { groupId: { value: ref.groupId } },
      });

      await Promise.all(
        cycles.map((cycle) =>
          this.cycleService.update(
            { ...ref, cycleId: cycle.id },
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
    const subgroups = await this.subgroupService.findAll(ref);

    await Promise.all(
      subgroups.map((subgroup) =>
        this.subgroupService.remove(
          { groupId: ref.groupId, subgroupId: subgroup.id },
          options,
        ),
      ),
    );

    // delete all trainings
    const trainings = await this.trainingService.findAll({
      user,
      filter: { groupId: { value: ref.groupId } },
    });

    await Promise.all(
      trainings.map((training) =>
        this.trainingService.remove({ trainingId: training.id }, options),
      ),
    );

    // delete all cycles
    const cycles = await this.cycleService.findAll(ref, options);

    await Promise.all(
      cycles.map((cycle) =>
        this.cycleService.remove(
          { groupId: ref.groupId, cycleId: cycle.id },
          options,
        ),
      ),
    );

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

    if (populate.includes('cycles'))
      group.cycles = await this.cycleService.findAll(ref);
  }
}
