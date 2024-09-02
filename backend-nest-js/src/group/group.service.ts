import { BadRequestException, forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Group } from './entity/group.entity';
import { User } from '../common/type/custom-claims.type';
import { UserService } from '../user/user.service';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';
import { Timestamp } from 'firebase-admin/firestore';
import { TrainingService } from '../training/training.service';
import { CycleService } from '../cycle/cycle.service';
import { Wrapper } from '../common/type/wrapper.type';
import dayjs from 'dayjs';

@Injectable()
export class GroupService {
  private logger: Logger;

  constructor(
    @InjectRepository(Group)
    private readonly repository: FirestoreRepository<Group>,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
    private readonly trainingService: TrainingService,
    @Inject(forwardRef(() => CycleService))
    private readonly cycleService: Wrapper<CycleService>,
  ) {
    this.logger = new Logger(GroupService.name);
  }

  canView(user: User, group: Group): boolean {
    return this.isMember(user, group) || this.isOwner(user, group);
  }

  isMember(user: User, group: Group): boolean {
    return group.membersIds.includes(user.uid);
  }

  isOwner(user: User, group: Group): boolean {
    return group.ownerId === user.uid;
  }

  /**
   * Returns all groups that user is member or owner of
   */
  async findAll(user: User) {
    // find all by user id and where parent is null
    const groups = await this.repository.findAllBy('ownerId', user.uid);
    const parents = groups.filter(group => !group.parentId);
    return parents.filter(group => this.canView(user, group));
  }

  /**
   * Returns all groups that user is member of.
   */
  async findAthleteGroups(user: User) {
    const all = await this.repository.getCollection()
      .where('memberIds', 'array-contains', user.uid);

    return await this.repository.findAllByMany([
      { field: 'membersIds', operator: 'array-contains', value: user.uid },
      { field: 'validUntil', operator: '>', value: Timestamp.now() },
    ]);
  }

  /**
   * Checks if user is owner or a member of the group and returns the group or
   * throws an error. It also updates the group with newly available members.
   */
  async findOneByIdOrFail(user: User, id: string): Promise<Group> {
    const group = await this.repository.findOneByIdOrFail(id);
    if (!this.canView(user, group))
      throw new BadRequestException('You are not a member of this group');

    // find all members in all subgroups
    group.subgroups = await this.repository.findAllByMany([
      { field: 'parentId', operator: '==', value: group.id },
      { field: 'validUntil', operator: '>', value: Timestamp.now() },
    ]);

    const availableMemberIds = await this.updateAvailableMemberIds(group.id);
    const subgroupMemberIds = group.subgroups.flatMap(subgroup => subgroup.membersIds);
    const memberIds = Array.from(new Set(availableMemberIds.concat(subgroupMemberIds)));

    group.user = await this.userService.findOneById(group.ownerId);
    group.members = await this.userService.findAll(user, { ids: memberIds });

    return group;
  }

  async create(user: User, data: Partial<Group>): Promise<Group> {
    // TODO - allow only 10 groups per user?
    this.logger.debug(`User ${user.uid} is creating group: ${JSON.stringify(data)}`);

    if (this.firebaseService.isAthlete(user))
      throw new UnauthorizedException('Athletes cannot create groups');

    if (!data.membersIds?.length)
      throw new BadRequestException('Group must have at least one member');

    const members = await this.userService.findAll(user, { ids: data.membersIds });

    if (data.parentId) {
      const parent = await this.repository.findOneByIdOrFail(data.parentId);
      if (parent.parentId)
        throw new BadRequestException('Subgroups cannot have subgroups');

      if (!this.isOwner(user, parent))
        throw new BadRequestException('You are not the owner of the parent group');

      if (!data.validUntil)
        throw new BadRequestException('Subgroups must have a valid until date');

      // all members must also be members of the parent group
      members.forEach(member => {
        if (!parent.membersIds.includes(member.uid))
          throw new BadRequestException('All members must be members of the parent group');
      });

      // delete members from parent group
      const memberIds = parent.membersIds.filter(id => !data.membersIds.includes(id));
      await this.repository.update(parent.id, { membersIds: memberIds });
    }

    const group = await this.repository.create({
      name: data.name,
      ownerId: user.uid,
      membersIds: members.map(member => member.uid),
      parentId: data.parentId || null,
      validUntil: data.validUntil || null,
      lastModifiedAvailableMembers: new Date(),
    });

    if (data.parentId) {
      // copy all trainings from all parent group's cycles to subgroup from now on until valid until date
      const cycles = await this.cycleService.findAll(user, { groupId: data.parentId });
      for (const cycle of cycles) {
        const trainings = await this.trainingService.findAll(user, {
          filter: {
            cycleId: cycle.id,
            startTime: dayjs().startOf('day').toDate(),
            endTime: data.validUntil,
          },
        });

        for (const training of trainings)
          await this.trainingService.copy(user, {
            trainingId: training.id,
            cycleId: cycle.id,
            subgroupId: group.id,
          });
      }
    }

    group.user = user;
    group.members = members;
    return group;
  }

  /**
   * Returns all available member ids for a group. This includes all members of
   * the group and all members of expired subgroups that can be "used" again.
   */
  private async updateAvailableMemberIds(groupId: string): Promise<string[]> {
    // TODO - cron job?
    const group = await this.repository.findOneById(groupId);
    if (!group)
      throw new BadRequestException('Group not found');

    if (group.parentId)
      throw new BadRequestException('Cannot update available members for subgroup');

    const invalidSubgroups = await this.repository.findAllByMany([
      { field: 'parentId', operator: '==', value: groupId },
      { field: 'validUntil', operator: '<=', value: Timestamp.now() },
    ]);

    // console.log(`invalid subgroups for group ${group.name}: ${JSON.stringify(invalidSubgroups)}`);

    // all members in expired subgroups become available again
    const memberIds = group.membersIds.concat(invalidSubgroups.flatMap(subgroup => subgroup.membersIds));
    const availableMemberIds = Array.from(new Set(memberIds));
    await this.repository.update(groupId, {
      membersIds: availableMemberIds,
      lastModifiedAvailableMembers: new Date(),
    });

    return availableMemberIds;
  }
}
