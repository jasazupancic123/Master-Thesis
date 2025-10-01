import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

import { IsTempo } from '@src/common/decorator/is-tempo.decorator';
import { IntType, VolType } from '@src/component/enum/param.enum';

export class PrescribedWorkload {
  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  pRecTime: number; // in seconds

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  pRecDist?: number; // in meters, for distance-based recovery

  /* --------------- Primary Side --------------- */
  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  pReps: number; // prefix "p" is for "prescribed"

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pLoad?: number; // always in kg

  @IsTempo()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pTempo?: string; // e.g. "2.5:0:3.5:0", meaning "eccentric:isometric:concentric:isometric" in seconds

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pTime?: number; // for isometric holds, in seconds

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pDist?: number; // for distance-based sets, in meters

  /* --------------- Secondary Side (if applicable) --------------- */

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pRepsR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pLoadR?: number;

  @IsTempo()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pTempoR?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pTimeR?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  pDistR?: number;

  /* --------------- Deprecated --------------- */
  @IsEnum(VolType)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volWork1Type?: VolType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedVolWork1ValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedVolWork1ValueR?: number;

  @IsEnum(VolType)
  @IsOptional()
  @ApiProperty({ enum: VolType })
  @Expose()
  volWork2Type?: VolType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedVolWork2ValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedVolWork2ValueR?: number;

  @IsEnum(VolType)
  @IsOptional()
  @ApiProperty({ enum: VolType })
  @Expose()
  volRecType?: VolType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedVolRecValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedVolRecValueR?: number;

  @IsEnum(IntType)
  @IsOptional()
  @ApiProperty({ enum: IntType })
  @Expose()
  intWork1Type?: IntType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedIntWork1ValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedIntWork1ValueR?: number;

  @IsEnum(IntType)
  @IsOptional()
  @ApiProperty({ enum: IntType })
  @Expose()
  intWork2Type?: IntType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedIntWork2ValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedIntWork2ValueR?: number;

  @IsEnum(IntType)
  @IsOptional()
  @ApiProperty({ enum: IntType })
  @Expose()
  intRecType?: IntType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedIntRecValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  prescribedIntRecValueR?: number;
}

export class CompletedWorkload {
  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  recTime: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  recDist?: number;

  /* --------------- Primary Side --------------- */
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
  load?: number;

  @IsTempo()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  tempo?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  time?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  dist?: number;

  /* --------------- Secondary Side (if applicable) --------------- */
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
  loadR?: number;

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
  timeR?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  distR?: number;

  /* --------------- Deprecated --------------- */
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volWork1ValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volWork1ValueR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volWork2ValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volWork2ValueR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volRecValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volRecValueR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intWork1ValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intWork1ValueR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intWork2ValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intWork2ValueR?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intRecValueL?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intRecValueR?: number;
}

export class WorkloadValue extends IntersectionType(
  PrescribedWorkload,
  CompletedWorkload,
) {}
