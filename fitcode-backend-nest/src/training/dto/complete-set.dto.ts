import { IntersectionType, PickType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { IsTempo } from '@src/common/decorator/is-tempo.decorator';
import { DateRangeDto } from '@src/common/dto/date-range.dto';

import { ExerciseSet } from '../entity/exercise-set.entity';
import { WorkloadMeta } from '../entity/workload.entity';

export class CompleteLSetDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  rom?: number; // in cm

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  velocity?: number; // in m/s

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  photoUrl?: string;

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

export class CompleteRSetDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  romR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  velocityR?: number;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  photoUrlR?: string;

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

export class CompleteSetDto extends IntersectionType(
  DateRangeDto,
  CompleteLSetDto,
  CompleteRSetDto,
  PickType(WorkloadMeta, ['userId', 'notes'] as const),
  PickType(ExerciseSet, [
    'recTime',
    'recDist',
    'reps',
    'load',
    'tempo',
    'time',
    'dist',
    'repsR',
    'loadR',
    'tempoR',
    'timeR',
    'distR',
  ] as const),
) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  eff?: number; // in %
}
