import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { VolType, IntType } from '../../component/enum/param.enum';
import { IntersectionType } from '@nestjs/mapped-types';

export class PrescribedWorkload {
  /* --------------- Vol Work 1 --------------- */
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

  /* --------------- Vol Work 2 --------------- */
  @IsEnum(VolType)
  @IsOptional()
  @ApiProperty()
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

  /* --------------- Vol Rec --------------- */
  @IsEnum(VolType)
  @IsOptional()
  @ApiProperty()
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

  /* --------------- Int Work 1 --------------- */
  @IsEnum(IntType)
  @IsOptional()
  @ApiProperty()
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

  /* --------------- Int Work 2 --------------- */
  @IsEnum(IntType)
  @IsOptional()
  @ApiProperty()
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

  /* --------------- Int Rec --------------- */
  @IsEnum(IntType)
  @IsOptional()
  @ApiProperty()
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
