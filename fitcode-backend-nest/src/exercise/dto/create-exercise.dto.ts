import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsObject } from 'class-validator';
import { Exercise } from '../entity/exercise.entity';

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
