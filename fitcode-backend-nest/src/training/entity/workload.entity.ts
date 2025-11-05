import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

import { SetStatus } from '../enum/set-status.enum';
import {
  ExerciseSet,
  ExerciseSetPrimarySide,
  ExerciseSetSecondarySide,
} from './exercise-set.entity';

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

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  supersetIndex: number;

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
  @ApiProperty({ enum: SetStatus })
  @Expose()
  status: SetStatus;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  notes?: string;
}

export class WorkloadPrimarySide extends ExerciseSetPrimarySide {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  rir?: number; // reps in reserve

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  rom?: number; // in cm
}

export class WorkloadSecondarySide extends ExerciseSetSecondarySide {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  rirR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  romR?: number;
}

export class WorkloadValue extends IntersectionType(
  WorkloadPrimarySide,
  WorkloadSecondarySide,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  timestamp: Date;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  @Expose()
  photoURLs?: string[];
}

export class Workload extends IntersectionType(WorkloadMeta, WorkloadValue) {
  @ValidateNested()
  @Type(() => ExerciseSet)
  @ApiProperty({ type: ExerciseSet })
  @Expose()
  prescribed: ExerciseSet;
}

export class CreateWorkload extends OmitType(Workload, [
  'id',
  'setNumber',
  'institutionId',
  'groupId',
  'cycleId',
  'trainingId',
  'componentId',
  'exerciseId',
  'supersetIndex',
  'status',
  'prescribed',
  'loadBw',
  'loadBwR',
  'loadRm',
  'loadRmR',
] as const) {}
