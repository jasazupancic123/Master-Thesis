import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IdEntity } from '../../common/entity/id.entity';
import { Workload } from '../entity/workload.entity';

export class UpdateTrainingDto extends PickType(Training, [
  'components',
  'membersIds',
  'warmup',
  'cooldown',
  'avgFutureWorkloadValues',
]) {}

export class UpdateTrainingDtoWithId extends PickType(Training, [
  'id',
  'components',
  'membersIds',
  'warmup',
  'cooldown',
  'avgFutureWorkloadValues',
]) {}

export class UpdateSingleTrainingDto extends PickType(Training, [
  'components',
  'warmup',
  'cooldown',
]) {}

export class BatchUpdateTrainingDto extends IntersectionType(
  IdEntity,
  UpdateTrainingDto,
) {}

export class BatchUpdateTrainingsDto {
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateTrainingDto)
  @ApiProperty()
  trainings: BatchUpdateTrainingDto[];
}

export class BatchUpdateTrainingsWithCustomAthleteWorkloadsDto {
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateTrainingDto)
  @ApiProperty()
  @Expose()
  trainings: BatchUpdateTrainingDto[];

  @ValidateNested({ each: true })
  @Type(() => Workload)
  @ApiProperty()
  @Expose()
  customAthleteWorkloads: Workload[];
}
