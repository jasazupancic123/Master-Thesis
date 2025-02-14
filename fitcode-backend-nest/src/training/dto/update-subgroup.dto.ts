import { Subgroup } from '../entity/subgroup.entity';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty, OmitType } from '@nestjs/swagger';

export class UpdateSubgroupDto extends OmitType(Subgroup, [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'components',
]) {}

export class UpdateSubgroupsDto {
  @ValidateNested({ each: true })
  @Type(() => UpdateSubgroupDto)
  @ApiProperty()
  @Expose()
  subgroups: UpdateSubgroupDto[];
}
