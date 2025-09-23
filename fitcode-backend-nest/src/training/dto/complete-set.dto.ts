import { applyDecorators } from '@nestjs/common';
import { IntersectionType, PickType } from '@nestjs/swagger';
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { DateRangeDto } from '@src/common/dto/date-range.dto';

import { WorkloadMeta } from '../entity/workload.entity';

export class CompleteLSetDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  reps?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  time?: number; // in s

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  dist?: number; // in m

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  load?: number; // in kg

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

  @IsNumber()
  @Min(1000)
  @Max(9999)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempo?: number; // e.g. 2010 (for 2:0:1:0), average tempo

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  photoUrl?: string;

  // the following fields are AI diagnostics
  @IsNumber({}, { each: true })
  @Min(1000, { each: true })
  @Max(9999, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [Number] })
  @Expose()
  tempos?: number[]; // tempo for each rep

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
  repsR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  timeR?: number; // in s

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  distR?: number; // in m

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadR?: number; // in kg

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  romR?: number; // in cm

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  velocityR?: number; // in m/s

  @IsNumber()
  @Min(1000)
  @Max(9999)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoR?: number; // e.g. 2010 (for 2:0:1:0)

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  photoUrlR?: string;

  // the following fields are AI diagnostics
  @IsNumber({}, { each: true })
  @Min(1000, { each: true })
  @Max(9999, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [Number] })
  @Expose()
  temposR?: number[]; // tempo for each rep

  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [Number] })
  @Expose()
  romsR?: number[]; // range of motion for each rep

  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [Number] })
  @Expose()
  velocitiesR?: number[]; // velocity for each rep

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @Expose()
  feedbackR?: string[]; // feedback for each rep
}

export function ApiIntersection(...models: Function[]) {
  return applyDecorators(
    ApiExtraModels(...models),
    ApiProperty({
      allOf: models.map((m) => ({ $ref: getSchemaPath(m) })),
    }),
  );
}

export class CompleteSetDto extends IntersectionType(
  PickType(WorkloadMeta, ['userId', 'notes'] as const),
  DateRangeDto,
  CompleteLSetDto,
  CompleteRSetDto,
) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  eff?: number; // in %

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  bpm?: number; // in bpm

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  mas?: number; // max aerobic speed (%)

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  recTime?: number; // in s

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  recDist?: number; // in m
}
