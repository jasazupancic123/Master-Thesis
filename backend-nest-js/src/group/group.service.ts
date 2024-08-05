import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CollectionReference } from 'firebase-admin/lib/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { GROUP_COLLECTION } from '../common/const/firestore.const';
import { GroupDto } from './dto/group.dto';
import { serializeToDto } from '../common/util/serialize';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CustomClaims } from '../common/type/custom-claims.type';
import { UserRole } from '../user/enum/user-role.enum';
import { PublicUserDto } from '../user/dto/user.dto';
import { firestore } from 'firebase-admin';

@Injectable()
export class GroupService {
  private logger: Logger
  private readonly collection: CollectionReference

  constructor(private readonly firebaseService: FirebaseService) {
    this.logger = new Logger(GroupService.name);
    this.collection = this.firebaseService.collection(GROUP_COLLECTION);
  }

  async findOne(id: string): Promise<GroupDto> {
    const group = await this.collection.doc(id).get();
    if (!group.exists)
      return null

    return serializeToDto(GroupDto, group.data());
  }

  async findAll(user: CustomClaims): Promise<GroupDto[]> {
    // get only groups where user is a member or owner
    const groups = await this.collection.get();

    const documents = groups.docs
      .filter(group => this.canView(user, group))
      .map(group => this.serialize(group));

    return await Promise.all(documents.map(async (item) => this.populate(item)));
  }

  async findOneById(user: CustomClaims, id: string): Promise<GroupDto> {
    const group = await this.collection.doc(id).get();

    if (!group.exists)
      return null;

    if (!this.canView(user, group))
      throw new BadRequestException('You are not a member of this group')

    const serialized = this.serialize(group);
    return await this.populate(serialized);
  }

  async create(user: CustomClaims, data: CreateGroupDto): Promise<GroupDto> {
    // TODO - allow only 10 groups per user?

    this.logger.debug(`Creating group for user ${user.uid}`);

    if (user.role.includes(UserRole.ATHLETE))
      throw new BadRequestException('Athletes cannot create groups')

    if (!data.memberIds?.length)
      throw new BadRequestException('Group must have at least one member')

    const item = {
      name: data.name,
      userId: user.uid,
      createdAt: new Date(),
      memberIds: data.memberIds,
      cycleIds: [],
    }

    const document = await this.collection.add(item as any);
    const group = await this.collection.doc(document.id).get();

    const serialized = this.serialize(group);
    return await this.populate(serialized);
  }

  async update(user: CustomClaims, id: string, data: UpdateGroupDto): Promise<GroupDto> {
    if (user.role.includes(UserRole.ATHLETE))
      // athlete can be owner of only his own group with just himself as a member
      if (data.memberIds?.length !== 1 || data.memberIds[0] !== user.uid)
        throw new BadRequestException('Athletes can only update their own group')

    const group = await this.collection.doc(id).get();
    if (!group.exists)
      throw new BadRequestException('Group not found')

    if (group.data().userId !== user.uid)
      throw new BadRequestException('You are not the owner of this group')

    await this.collection.doc(id).update(data as any);
    return serializeToDto(GroupDto, { id, ...data });
  }

  canView(user: CustomClaims, group: GroupDto): boolean;
  canView(user: CustomClaims, group: firestore.DocumentSnapshot): boolean
  canView(user: CustomClaims, group: GroupDto | firestore.DocumentSnapshot): boolean {
    if (group instanceof GroupDto)
      return group.memberIds.includes(user.uid) || group.userId === user.uid
    else
      return group.data().memberIds.includes(user.uid) || group.data().userId === user.uid
  }

  private serialize(document: firestore.DocumentSnapshot): GroupDto {
    return serializeToDto(GroupDto, {
      id: document.id,
      name: document.data().name,
      userId: document.data().userId,
      memberIds: document.data().memberIds,
      cycleIds: document.data().cycleIds,
      createdAt: document.data().createdAt.toDate(),
    });
  }

  private async populate(item: GroupDto): Promise<GroupDto> {
    item.user = serializeToDto(PublicUserDto, await this.firebaseService.auth.getUser(item.userId));

    const members = await Promise.all(item.memberIds.map(async (id) => this.firebaseService.auth.getUser(id)));
    item.members = serializeToDto(PublicUserDto, members);

    return item;
  }
}
