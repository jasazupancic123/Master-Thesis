import { GroupDto } from './group.dto';
import { PartialType, PickType } from '@nestjs/mapped-types';

export class UpdateGroupDto extends PartialType(PickType(GroupDto, [
  'name',
  'memberIds',
  'cycleIds',
])) {}