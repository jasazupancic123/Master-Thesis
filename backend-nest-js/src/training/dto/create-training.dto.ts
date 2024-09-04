import { PickType } from '@nestjs/mapped-types';
import { Training } from '../entity/training.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateTrainingDto extends PickType(Training, [
  'subgroupId',
  'from',
  'to',
] as const) {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  componentIds: string[];
}
