import { PartialType, PickType } from '@nestjs/mapped-types';
import { Group } from '../entity/group.entity';
import { IntersectionType } from '@nestjs/swagger';

export class UpdateGroupDto extends PartialType(
  PickType(Group, ['name', 'membersIds', 'cycles'] as const),
) {}

export class UpdateGroupDtoWithId extends IntersectionType(
  PickType(Group, ['id'] as const),
  UpdateGroupDto,
) {}
