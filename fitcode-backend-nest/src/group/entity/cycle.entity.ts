import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';

import { CycleLevel } from '../enum/cycle-level.enum';

export interface Week {
  date: Date;
}

export class CycleTarget {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  targetId: string;

  @IsEnum(CycleLevel)
  @ApiPropertyOptional({ enum: CycleLevel })
  @IsOptional()
  @Expose()
  level?: CycleLevel;
}

export class Cycle extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  description?: string;

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

  @ValidateNested({ each: true })
  @Type(() => CycleTarget)
  @ApiProperty({ type: () => CycleTarget, isArray: true })
  @Expose()
  targets: CycleTarget[];
}
