import { PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';
import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateTrainingDto extends PickType(Training, [
  'cycleId',
  'subgroupId',
  'startTime',
  'endTime',
] as const) {
  @IsString({ each: true })
  @Expose()
  componentIds: string[];
}
