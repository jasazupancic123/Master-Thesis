import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

import { Training } from '../entity/training.entity';
import { Workload } from '../entity/workload.entity';

export class UpdateTrainingDto extends PickType(Training, [
  'components',
  'membersIds',
  'warmup',
  'cooldown',
]) {
  @ValidateNested({ each: true })
  @Type(() => Workload)
  @ApiProperty()
  @Expose()
  workloads: Workload[]; // custom workloads
}

export class BatchUpdateTrainingDto extends IntersectionType(
  IdEntity,
  UpdateTrainingDto,
) {}

export class BatchUpdateTrainingsDto {
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateTrainingDto)
  @ApiProperty()
  @Expose()
  trainings: BatchUpdateTrainingDto[];
}
