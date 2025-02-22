import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsStringOrNumber } from 'src/common/decorator/is-string-or-number.decorator';
import { TimestampEntity } from 'src/common/entity/timestamp.entity';
import { SetStatus } from '../enum/set-status.enum';
import { SetType } from '../enum/set-type.enum';
import { WorkloadType } from '../enum/workload-type.enum';
import { WorkloadData } from './workload-data';

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
  exerciseId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @ApiProperty()
  @Expose()
  sets: number;

  @IsEnum(SetType)
  @ApiProperty()
  @Expose()
  setType: SetType;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  setTypeValue: number;

  @IsEnum(WorkloadType)
  @ApiProperty()
  @Expose()
  workloadType: WorkloadType;

  @IsStringOrNumber()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  workloadValue: number; // calculated value prescribed by trainer

  @IsEnum(SetStatus)
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  status: SetStatus;

  @ValidateNested({ each: true })
  @Type(() => WorkloadData)
  @ApiProperty()
  @Expose()
  data: WorkloadData[];
}
