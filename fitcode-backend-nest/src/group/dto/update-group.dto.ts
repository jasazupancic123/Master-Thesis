import { PartialType, PickType } from '@nestjs/mapped-types';
import { Group } from '../entity/group.entity';

export class UpdateGroupDto extends PartialType(
  PickType(Group, ['name', 'membersIds', 'cycles'] as const),
) {}
