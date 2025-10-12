import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { IsTempo } from '@src/common/decorator/is-tempo.decorator';
import { LoadType } from '@src/training/enum/load-type.enum';

export class ExerciseSetPrimarySide {
  @IsInt()
  @Min(1)
  @ApiProperty()
  @Expose()
  reps: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadKg?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadRm?: number;

  @IsInt()
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

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  vel?: number; // in m/s
}

export class ExerciseSetSecondarySide {
  @IsInt()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional()
  @Expose()
  repsR?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadKgR?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  loadRmR?: number;

  @IsInt()
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

  @IsInt()
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

  @IsEnum(() => LoadType)
  @IsOptional()
  @ApiPropertyOptional({ enum: LoadType })
  @Expose()
  loadType?: LoadType;

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  eff?: number; // rpe (rate of perceived exertion)

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  recTime: number; // in seconds

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
