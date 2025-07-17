import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { TimestampEntity } from '@src/common/entity/timestamp.entity';

import { SetStatus } from '../enum/set-status.enum';
import { CompletedWorkload, PrescribedWorkload } from './workload-value.entity';

export class Workload extends IntersectionType(
  TimestampEntity,
  PrescribedWorkload,
  CompletedWorkload,
) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  institutionId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
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

  @IsEnum(SetStatus)
  @ApiProperty()
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

  @IsBoolean()
  @ApiProperty()
  @Expose()
  isCustom: boolean; // indicating whether workload is changed by trainer and contains only changed prescribed values, not actual completed ones
}
