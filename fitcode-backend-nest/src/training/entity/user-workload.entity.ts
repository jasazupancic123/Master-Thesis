import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsStringOrNumber } from '../../common/decorator/is-string-or-number.decorator';
import { TimestampEntity } from '../../common/entity/timestamp.entity';
import { SetStatus } from '../enum/set-status.enum';

export class UserWorkload extends TimestampEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string; // also document id

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
  @Max(10)
  @ApiProperty()
  @Expose()
  sets: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  setType: string;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedSetTypeValue: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  workloadType: string;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  prescribedWorkloadValue: number; // calculated value prescribed by trainer

  @IsEnum(SetStatus)
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  status: SetStatus;

  @IsInt()
  @Min(1)
  @Max(10)
  @ApiProperty()
  @Expose()
  set: number; // current set number

  @IsInt()
  @Min(1)
  @Expose()
  setTypeValue: number; // actual user reps / distance / time / ... completed

  @IsStringOrNumber()
  @IsNotEmpty()
  @Expose()
  @Min(0)
  workloadValue: string | number; // actual user kg completed

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  notes?: string;
}
