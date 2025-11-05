import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

import { CopiedFrom } from './copied-from.entity';
import { Subgroup } from './subgroup.entity';
import { Superset } from './superset.entity';

export class TrainingComponent extends IdEntity {
  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  to: Date;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  targetId?: string; // target id which the component trains towards

  @ValidateNested({ each: true })
  @Type(() => Superset)
  @ApiProperty({ type: () => Superset, isArray: true })
  @Expose()
  supersets: Superset[];

  @ValidateNested({ each: true })
  @Type(() => Subgroup)
  @ApiProperty({ type: () => Subgroup, isArray: true })
  @Expose()
  subgroups: Subgroup[];

  @Type(() => CopiedFrom)
  @IsOptional()
  @ApiPropertyOptional({ type: () => CopiedFrom })
  @Expose()
  copiedFrom?: CopiedFrom; // used for copying components from other trainings
}

export type TrainingComponentWithoutTime = Omit<
  TrainingComponent,
  'from' | 'to'
>;
