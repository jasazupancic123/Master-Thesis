import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
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

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  notes?: string;

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
  prescribedVolWork1Value?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volWork1Value?: number;

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
  prescribedVolWork2Value?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volWork2Value?: number;

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
  prescribedVolRecValue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  volRecValue?: number;

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
  prescribedIntWork1Value?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intWork1Value?: number;

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
  prescribedIntWork2Value?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intWork2Value?: number;

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
  prescribedIntRecValue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty()
  @Expose()
  intRecValue?: number;
}
