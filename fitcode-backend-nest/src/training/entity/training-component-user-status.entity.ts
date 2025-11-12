import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';

import { TrainingStatus } from '../enum/training-status.enum';

export class TrainingComponentUserStatus extends BaseEntity {
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
}
