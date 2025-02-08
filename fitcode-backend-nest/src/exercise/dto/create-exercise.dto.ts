import { Exercise } from '../entity/exercise.entity';
import { PickType } from '@nestjs/mapped-types';
import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateExerciseDto extends PickType(Exercise, [
  'name',
  'componentsIds',
  'imageUrl',
  'videoUrl',
] as const) {
  @IsObject()
  @ApiProperty()
  @Expose()
  attributeValues: Record<string, any>;
}
