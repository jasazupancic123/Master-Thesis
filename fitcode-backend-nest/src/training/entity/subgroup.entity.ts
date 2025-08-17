import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

import { Superset } from './superset.entity';

export class Subgroup extends IntersectionType(IdEntity) {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  parentId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the sub-training (at least 1)

  @ValidateNested({ each: true })
  @Type(() => Superset)
  @ApiProperty({ type: () => Superset, isArray: true })
  @Expose()
  supersets: Superset[];
}
