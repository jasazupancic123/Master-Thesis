import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { GroupDto } from './dto/group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CustomClaims } from '../common/type/custom-claims.type';
import { UserRole } from '../user/enum/user-role.enum';
import { UserService } from '../user/user.service';
import { InjectRepository } from '../common/decorator/entity.decorator';
import { FirestoreRepository } from '../firebase/firestore.repository';

@Injectable()
export class GroupService {
  private logger: Logger;

  constructor(
    @InjectRepository(GroupDto)
    private readonly repository: FirestoreRepository<GroupDto>,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
  ) {
    this.logger = new Logger(GroupService.name);
  }

  async findAll(user: CustomClaims) {
    // get only groups where user is a member or owner
    // const groups = await this.repository.findAllBy('userId', user.uid);

    // find all by user id and where parent is null
    const groups = await this.repository.findAllBy('userId', user.uid);
    const parents = groups.filter(group => !group.parentId);
    return parents.filter(group => this.canView(user, group));
  }

  async findOneByIdOrFail(user: CustomClaims, id: string): Promise<GroupDto> {
    const group = await this.repository.findOneByIdOrFail(id);

    if (!this.canView(user, group))
      throw new BadRequestException('You are not a member of this group');

    group.user = await this.userService.findOne(group.userId);
    group.subgroups = await this.repository.findAllBy('parentId', group.id);

    // find all members in all subgroups
    const memberIds = group.memberIds.concat(group.subgroups.flatMap(subgroup => subgroup.memberIds));
    group.members = await this.userService.findAllByIds(user, memberIds);

    return group;
  }

  async create(user: CustomClaims, data: CreateGroupDto): Promise<GroupDto> {
    // TODO - allow only 10 groups per user?
    this.logger.debug(`Creating group for user ${user.uid}: ${JSON.stringify(data)}`);

    if (user.role.includes(UserRole.ATHLETE))
      throw new BadRequestException('Athletes cannot create groups');

    if (!data.memberIds?.length)
      throw new BadRequestException('Group must have at least one member');

    const members = await this.userService.findAllByIds(user, data.memberIds);

    if (data.parentId) {
      const parent = await this.repository.findOneByIdOrFail(data.parentId);

      // all members must also be members of the parent group
      members.forEach(member => {
        if (!parent.memberIds.includes(member.uid))
          throw new BadRequestException('All members must be members of the parent group');
      });

      if (parent.userId !== user.uid)
        throw new BadRequestException('You are not the owner of the parent group');

      // delete members from parent group
      await this.repository.update(parent.id, { memberIds: parent.memberIds.filter(id => !data.memberIds.includes(id)) });
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

  async update(user: CustomClaims, id: string, data: UpdateGroupDto): Promise<GroupDto> {
    if (user.role.includes(UserRole.ATHLETE))
      // athlete can be owner of only his own group with just himself as a member
      if (data.memberIds?.length !== 1 || data.memberIds[0] !== user.uid)
        throw new BadRequestException('Athletes can only update their own group');

    const group = await this.findOneByIdOrFail(user, id);

    if (!this.isOwner(user, group))
      throw new BadRequestException('You are not the owner of this group');

    return await this.repository.update(id, data);
  }

  canView(user: CustomClaims, group: GroupDto): boolean {
    return group.memberIds.includes(user.uid) || this.isOwner(user, group);
  }

  isOwner(user: CustomClaims, group: GroupDto): boolean {
    return group.userId === user.uid;
  }
}
