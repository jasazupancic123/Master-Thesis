import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

import { DateRangeDto } from '@src/common/dto/date-range.dto';

import { WorkloadMeta } from '../entity/workload.entity';

export class CompleteLSetDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  repsL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  timeL?: number; // in s

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  distL?: number; // in m

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadL?: number; // in kg

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  romL?: number; // in cm

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  velocityL?: number; // in m/s
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
}

export class CompleteSetDto extends IntersectionType(
  PickType(WorkloadMeta, ['trainingId', 'exerciseId', 'notes'] as const),
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
  @Max(9999)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempo?: number; // e.g. 2010 (for 2:0:1:0)

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
