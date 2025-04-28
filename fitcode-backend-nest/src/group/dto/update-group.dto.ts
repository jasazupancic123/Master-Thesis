import { PartialType, PickType } from '@nestjs/mapped-types';
import { Group } from '../entity/group.entity';

export class UpdateGroupDtoWithId extends PartialType(
  PickType(Group, ['id', 'name', 'membersIds', 'cycles'] as const),
) {}

export class UpdateGroupDto extends PartialType(
  PickType(Group, ['name', 'membersIds', 'cycles'] as const),
) {}
