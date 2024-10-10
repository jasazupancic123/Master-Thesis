import { Group } from '../entity/group.entity';
import { PickType } from '@nestjs/mapped-types';
import { CreateGroup } from '../type/group.type';

export class CreateGroupDto
  extends PickType(Group, ['name', 'membersIds'])
  implements Omit<CreateGroup, 'ownerId'> {}
