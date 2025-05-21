import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IdEntity } from '../../common/entity/id.entity';

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
