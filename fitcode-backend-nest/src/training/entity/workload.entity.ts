import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TimestampEntity } from '../../common/entity/timestamp.entity';
import { IntType, VolType } from '../../component/enum/param.enum';
import { SetStatus } from '../enum/set-status.enum';

export class Workload extends TimestampEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  cycleId: string;

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

  @IsEnum(SetStatus)
  @ApiProperty()
  @Expose()
  status: SetStatus;

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  plannedAt: Date; // same date as the training

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  notes?: string;

  @IsBoolean()
  @ApiProperty()
  @Expose()
  isPersonalized: boolean;

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
