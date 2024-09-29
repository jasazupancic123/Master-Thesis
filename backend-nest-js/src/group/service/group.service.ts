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
import {
  GroupRef,
  SubgroupRef,
} from '../../common/type/firebase-firestore.type';
import { GroupRepository } from '../repository/group.repository';
import { DEFAULT_PAGE_SIZE } from '../../common/constant/pagination.constant';
import { CycleService } from './cycle.service';
import { SubgroupService } from './subgroup.service';
import { UserRepository } from '../../user/repository/user.repository';
import { CreateGroup, UpdateGroup } from '../type/group.type';
import { CreateSubgroup, UpdateSubgroup } from '../type/subgroup.type';
import { CreateCycle } from '../type/cycle.type';
import { endOfDay, isAfter, isSameDay, startOfDay } from 'date-fns';
import { TrainingExerciseUserDataService } from '../../training/service/training-exercise-user-data.service';
import { User } from '../../common/type/firebase-auth.type';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class GroupService {
  private logger = new Logger(GroupService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly groupRepository: GroupRepository,
    private readonly cycleService: CycleService,
    private readonly subgroupService: SubgroupService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
    @Inject(forwardRef(() => TrainingExerciseUserDataService))
    private readonly trainingExerciseUserDataService: Wrapper<TrainingExerciseUserDataService>,
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
    ref: Required<GroupRef>,
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
        groups.map((group) => this.populate(ref, group, options.populate)),
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
      members.map((member) =>
        this.userRepository.addGroup(member.uid, groupId),
      ),
    );

    return {
      id: groupId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: user.uid,
      name: input.name,
      owner: null,
      membersIds,
      availableMembersIds: membersIds,
      members,
      subgroups: [],
      cycles: [],
    };
  }

  /**
   * Update group fields that are not sub collections or arrays. For them,
   * special methods are provided.
   */
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

    // update group
    await this.groupRepository.updateDoc(ref.groupId, input);

    return {
      id: ref.groupId,
      ...group,
      ...input,
      updatedAt: new Date(),
    };
  }

  /**
   * Soft deletes a group by setting the deletedAt field to the current date.
   */
  async remove(ref: Required<GroupRef>): Promise<void> {
    this.logger.debug(`User ${ref.uid} is removing group ${ref.groupId}`);
    const group = await this.findOneOrFail(ref);
    await this.groupRepository.deleteDoc(ref);
  }

  /**
   * Adds a user to a group. The user is added to the group's membersIds and
   * the group is added to the user's groupsIds. For each training in the group,
   * the user's training exercise user data is created.
   */
  async addMember(
    userId: string,
    ref: Required<GroupRef>,
    memberId: string,
  ): Promise<void> {
    // find parent references and user
    const group = await this.findOneOrFail(ref, { userId });
    const user = await this.userService.findOneOrFail(memberId);

    // add user to group
    await this.groupRepository.updateDoc(ref, {
      membersIds: this.commonService.array.unique([
        ...group.membersIds,
        user.id,
      ]),
    });

    // add group to user
    await this.userRepository.addGroup(user.id, ref.groupId);

    // all trainings in group
    const trainings = await this.trainingService.findAllByGroup(ref, {
      authorize: false,
      populate: [
        'components',
        'components.supersets',
        'components.supersets.exercises',
      ],
    });

    // for each training, add user's training exercise user data
    await Promise.all(
      trainings.map((training) => {
        for (const component of training.components) {
          for (const superset of component.supersets) {
            for (const exercise of superset.exercises) {
              this.trainingExerciseUserDataService.create(
                {
                  ...ref,
                  cycleId: training.cycle.id,
                  trainingId: training.id,
                  subgroupId: null,
                  componentId: component.componentId,
                  supersetId: superset.id,
                  exerciseId: exercise.exerciseId,
                },
                memberId,
                exercise.meta,
              );
            }
          }
        }
      }),
    );
  }

  /**
   * Removes a user from a group by removing the user from the group's
   * membersIds and removing the group from the user's groupsIds, but it keeps
   * the user's training exercise user data for statistics.
   */
  async removeMember(
    userId: string,
    ref: Required<GroupRef>,
    memberId: string,
  ): Promise<void> {
    // find parent references and user
    const group = await this.findOneOrFail(ref, { userId });
    const user = await this.userService.findOneOrFail(memberId);

    // remove user from group
    await this.groupRepository.updateDoc(ref, {
      membersIds: group.membersIds.filter((memberId) => memberId !== user.id),
    });

    // remove group from user
    await this.userRepository.removeGroup(user.id, ref.groupId);
  }

  async addSubgroup(
    ref: Required<GroupRef>,
    input: CreateSubgroup,
    options: { user: User },
  ): Promise<Subgroup> {
    const { user } = options;
    this.logger.debug(
      `Adding subgroup (user ${user.uid}) for group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    // validate members
    const members = await this.validateMembers(input.membersIds);
    const subgroup = await this.subgroupService.create(
      ref,
      {
        name: input.name,
        membersIds: members.map((member) => member.uid),
        from: input.from,
        to: input.to,
      },
      { user },
    );

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

  /**
   * Update subgroup fields that are not sub collections or arrays. For them,
   * special methods are provided.
   */
  async updateSubgroup(ref: Required<SubgroupRef>, input: UpdateSubgroup) {
    // find parent references
    const subgroup = await this.subgroupService.findOneOrFail(ref);

    // update subgroup
    await this.subgroupService.update(ref, input);

    // if subgroup's `to` date is updated, we need to add / update
    // trainings and exercise data for the new period.
    if (input.to) {
      if (isSameDay(input.to, subgroup.to)) return;
      if (isAfter(input.to, subgroup.to)) {
        // TODO - extend subgroup period (copy parent group trainings)
      } else {
        // TODO - shorten subgroup period (remove subgroup trainings)
      }
    }
  }

  async removeSubgroup(ref: Required<SubgroupRef>) {
    await this.subgroupService.remove(ref);
  }

  async addCycle(ref: Required<GroupRef>, input: CreateCycle): Promise<Cycle> {
    this.logger.debug(
      `Adding cycle (user ${ref.uid}) for group ${ref.groupId}: ${JSON.stringify(input)}`,
    );

    return await this.cycleService.create(ref, input);
  }

  async updateCycle() {
    // TODO
  }

  async removeCycle() {
    // TODO
  }

  /**
   * Finds all available members for a group. First, all active subgroups and
   * their members are found, then only unique values are found, and finally,
   * the result is subtracted from all group members to get the available
   * members.
   *
   * Formula: (all group members - union of all members in active subgroups)
   */
  async findAvailableMembers(
    ref: Required<GroupRef>,
    options?: { user?: User },
  ): Promise<string[]> {
    const group = await this.findOneOrFail(ref, options);

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
  }
}
