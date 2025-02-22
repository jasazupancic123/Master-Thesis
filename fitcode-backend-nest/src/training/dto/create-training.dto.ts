import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { Training } from '../entity/training.entity';

export class CreateTrainingDto extends PickType(Training, [
  'groupId',
  'cycleId',
  'from',
  'to',
]) {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  componentsIds: string[];
}
