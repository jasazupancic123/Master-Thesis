import { PartialType, PickType } from '@nestjs/mapped-types';
import { Group } from '../entity/group.entity';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IdEntity } from '../../common/entity/id.entity';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class UpdateGroupDto extends PartialType(
  PickType(Group, ['ownerId', 'name', 'membersIds', 'cycles'] as const),
) {}

export class BatchUpdateOneGroupDto extends IntersectionType(
  IdEntity,
  UpdateGroupDto,
) {}

export class BatchUpdateGroupsDto {
  @Type(() => BatchUpdateOneGroupDto)
  @ValidateNested({ each: true })
  @ApiProperty()
  @Expose()
  groups: BatchUpdateOneGroupDto[];
}
