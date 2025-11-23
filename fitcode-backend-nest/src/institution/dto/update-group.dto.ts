import { PartialType, PickType } from '@nestjs/mapped-types';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

import { Group } from '../entity/group.entity';

export class UpdateGroupDto extends PartialType(
  PickType(Group, ['trainerIds', 'name', 'cycles'] as const),
) {}

export class BatchUpdateOneGroupDto extends IntersectionType(
  IdEntity,
  UpdateGroupDto,
) {}

export class BatchUpdateGroupsDto {
  @Type(() => BatchUpdateOneGroupDto)
  @ValidateNested({ each: true })
  @ApiProperty({ type: () => BatchUpdateOneGroupDto, isArray: true })
  @Expose()
  groups: BatchUpdateOneGroupDto[];
}
