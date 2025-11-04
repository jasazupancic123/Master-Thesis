import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export type ExerciseParamField = Exclude<
  keyof ExerciseSet,
  'setNumber' // "meta" field
>;

export type ExerciseMainParamField = Exclude<
  ExerciseParamField,
  keyof ExerciseSetSecondarySide
>;

export class ExerciseSetPrimarySide {
  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  reps?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadRm?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadBw?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  vel?: number; // in m/s

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoEcc?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoIso?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoCon?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoIdle?: number;

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  eff?: number; // rpe (rate of perceived exertion)

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  time?: number; // for isometric holds, in seconds

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  dist?: number; // for distance-based sets, in meters

  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  recTime?: number; // in seconds

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  recDist?: number; // in meters, for distance-based recovery
}

export class ExerciseSetSecondarySide {
  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  repsR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadKgR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadRmR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadBwR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  velR?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoEccR?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoIsoR?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoConR?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoIdleR?: number;

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  effR?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  timeR?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  distR?: number;

  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  recTimeR?: number; // in seconds

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  recDistR?: number; // in meters, for distance-based recovery
}

export class ExerciseSet extends IntersectionType(
  ExerciseSetPrimarySide,
  ExerciseSetSecondarySide,
) {
  @IsInt()
  @Min(1)
  @Max(20)
  @ApiProperty()
  @Expose()
  setNumber: number;
}
