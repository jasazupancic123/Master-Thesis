import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsStringOrNumber } from '../../common/decorator/is-string-or-number.decorator';
import { SetStatus } from '../enum/set-status.enum';
import { WorkloadType } from '../enum/workload-type.enum';

export class TrainingWorkload {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string; // document id

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsObject()
  @ApiProperty()
  @Expose()
  exercises: {
    [exerciseId: string]: Workload;
  };
}

export class Workload {
  @IsEnum(WorkloadType)
  @ApiProperty()
  @Expose()
  workloadType: WorkloadType;

  @IsStringOrNumber()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  workloadValue: string | number; // calculated value prescribed by trainer

  @ValidateNested({ each: true })
  @Expose()
  sets: SetData[];
}

export class SetData {
  @IsEnum(SetStatus)
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  status: SetStatus;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  setTypeValue?: number; // actual user reps / distance / time / ... completed

  @IsStringOrNumber()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  workloadValue?: string | number; // actual user kg completed

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  notes?: string;
}
