import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

import { IsTempo } from '@src/common/decorator/is-tempo.decorator';

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

  @IsTempo()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempo?: string; // e.g. "2.5:0:3.5:0", meaning "eccentric:isometric:concentric:isometric" in seconds

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  vel?: number; // in m/s
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

  @IsTempo()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempoR?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  velR?: number;
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

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  eff?: number; // rpe (rate of perceived exertion)

  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  recTime?: number; // in seconds

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
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  recDist?: number; // in meters, for distance-based recovery
}
