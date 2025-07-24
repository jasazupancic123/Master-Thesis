import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';
import { TimestampEntity } from '@src/common/entity/timestamp.entity';

import { SetStatus } from '../enum/set-status.enum';
import { WorkloadValue } from './workload-value.entity';

export class WorkloadMeta extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  institutionId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  cycleId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsInt()
  @Min(1)
  @ApiProperty()
  @Expose()
  setNumber: number;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  supersetIndex: number;

  @IsEnum(SetStatus)
  @ApiProperty({ enum: SetStatus })
  @Expose()
  status: SetStatus;

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  plannedAt: Date; // same date as the training

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  notes?: string;
}

export class Workload extends IntersectionType(
  TimestampEntity,
  WorkloadMeta,
  WorkloadValue,
) {}
