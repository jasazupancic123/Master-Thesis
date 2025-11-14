import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { DateRangeDto } from '@src/common/dto/date-range.dto';
import { IdEntity } from '@src/common/entity/id.entity';

import { TrainingStatus } from '../enum/training-status.enum';
import { BaseAggregatedReport } from '../type/training-set.type';

export class TrainingComponentUserStatus
  extends IntersectionType(IdEntity, DateRangeDto)
  implements BaseAggregatedReport
{
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  institutionId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  cycleId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsEnum(TrainingStatus)
  @ApiProperty({ enum: TrainingStatus })
  @Expose()
  status: TrainingStatus;

  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty()
  @Expose()
  realization: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  reps: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  tut: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  tonnage: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  time: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  dist: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  recTime: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  recDist: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  exercises: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  sets: number;
}
