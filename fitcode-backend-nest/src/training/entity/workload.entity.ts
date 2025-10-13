import { IntersectionType } from '@nestjs/mapped-types';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PickType,
} from '@nestjs/swagger';
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

import { IsTempo } from '@src/common/decorator/is-tempo.decorator';
import { IdEntity } from '@src/common/entity/id.entity';

import { SetStatus } from '../enum/set-status.enum';
import {
  ExerciseSet,
  ExerciseSetPrimarySide,
  ExerciseSetSecondarySide,
} from './exercise-set.entity';

export class CompletedWorkload extends OmitType(ExerciseSet, [
  'setNumber',
] as const) {}

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

  // the following fields are AI diagnostics
  @IsTempo({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempos?: string[]; // tempo for each rep

  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [Number] })
  @Expose()
  roms?: number[]; // range of motion for each rep

  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [Number] })
  @Expose()
  velocities?: number[]; // velocity for each rep

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @Expose()
  feedback?: string[]; // feedback for each rep
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

  // the following fields are AI diagnostics
  @IsTempo({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  temposR?: string[];

  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: Number, isArray: true })
  @Expose()
  romsR?: number[];

  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: Number, isArray: true })
  @Expose()
  velocitiesR?: number[];

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: String, isArray: true })
  @Expose()
  feedbackR?: string[];
}

export class WorkloadValue extends IntersectionType(
  WorkloadPrimarySide,
  WorkloadSecondarySide,
  PickType(ExerciseSet, ['eff', 'recTime', 'recDist', 'time', 'dist'] as const),
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
