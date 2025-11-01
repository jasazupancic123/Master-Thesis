import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { Training } from '../entity/training.entity';
import { TrainingComponent } from '../entity/training-component.entity';

export class CreateTrainingComponentDto extends PickType(TrainingComponent, [
  'id',
  'targetId',
  'methodId',
  'copiedFrom',
]) {}

export class CreateTrainingDto extends PickType(Training, [
  'groupId',
  'cycleId',
  'membersIds',
  'copiedFromId',
  'from',
]) {
  @ValidateNested({ each: true })
  @Type(() => CreateTrainingComponentDto)
  @ApiProperty({ type: CreateTrainingComponentDto, isArray: true })
  @Expose()
  components: CreateTrainingComponentDto[];
}
