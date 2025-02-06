import { Group } from '../entity/group.entity';
import { PickType } from '@nestjs/mapped-types';
import { CreateGroup } from '../type/group.type';

// NOTE - `ownerId` is inferred from request user
export class CreateGroupDto
  extends PickType(Group, ['name', 'membersIds'])
  implements CreateGroup {}
