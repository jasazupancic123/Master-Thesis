import { Group } from '../entity/group.entity';
import { PartialType, PickType } from '@nestjs/mapped-types';

export class UpdateGroupDto extends PartialType(PickType(Group, [
  'name',
  'memberIds',
  'validUntil',
])) {
}