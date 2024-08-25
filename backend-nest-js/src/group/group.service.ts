import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Group } from './entity/group.entity';
import { User } from '../common/type/custom-claims.type';
import { UserService } from '../user/user.service';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';

@Injectable()
export class GroupService {
  private logger: Logger;

  constructor(
    @InjectRepository(Group)
    private readonly repository: FirestoreRepository<Group>,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
  ) {
    this.logger = new Logger(GroupService.name);
  }

  canView(user: User, group: Group): boolean {
    return this.isMember(user, group) || this.isOwner(user, group);
  }

  isMember(user: User, group: Group): boolean {
    return group.memberIds.includes(user.uid);
  }

  isOwner(user: User, group: Group): boolean {
    return group.userId === user.uid;
  }

  /**
   * Returns all groups that user is member or owner of
   */
  async findAll(user: User) {
    // find all by user id and where parent is null
    const groups = await this.repository.findAllBy('userId', user.uid);
    const parents = groups.filter(group => !group.parentId);
    return parents.filter(group => this.canView(user, group));
  }

  /**
   * Checks if user is owner or a member of the group and returns the group or
   * throws an error.
   */
  async findOneByIdOrFail(user: User, id: string): Promise<Group> {
    const group = await this.repository.findOneByIdOrFail(id);
    if (!this.canView(user, group))
      throw new BadRequestException('You are not a member of this group');

    // find all members in all subgroups
    group.subgroups = await this.repository.findAllBy('parentId', group.id);
    group.user = await this.userService.findOneById(group.userId);

    const memberIds = group.memberIds.concat(group.subgroups.flatMap(subgroup => subgroup.memberIds));
    group.members = await this.userService.findAll(user, { ids: memberIds });

    return group;
  }

  async create(user: User, data: Partial<Group>): Promise<Group> {
    // TODO - allow only 10 groups per user?
    this.logger.debug(`User ${user.uid} is creating group: ${JSON.stringify(data)}`);

    if (this.firebaseService.isAthlete(user))
      throw new UnauthorizedException('Athletes cannot create groups');

    if (!data.memberIds?.length)
      throw new BadRequestException('Group must have at least one member');

    const members = await this.userService.findAll(user, { ids: data.memberIds });

    if (data.parentId) {
      const parent = await this.repository.findOneByIdOrFail(data.parentId);

      // all members must also be members of the parent group
      members.forEach(member => {
        if (!parent.memberIds.includes(member.uid))
          throw new BadRequestException('All members must be members of the parent group');
      });

      if (!this.isOwner(user, parent))
        throw new BadRequestException('You are not the owner of the parent group');

      // delete members from parent group
      const memberIds = parent.memberIds.filter(id => !data.memberIds.includes(id));
      await this.repository.update(parent.id, { memberIds });
    }

    const group = await this.repository.create({
      name: data.name,
      userId: user.uid,
      memberIds: members.map(member => member.uid),
      parentId: data.parentId || null,
    });

    group.user = user;
    group.members = members;
    return group;
  }
}
