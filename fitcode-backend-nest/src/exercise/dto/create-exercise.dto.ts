import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { Exercise } from '../entity/exercise.entity';

export class CreateExerciseDto extends PickType(Exercise, [
  'name',
  'componentIds',
  'isUnilateral',
  'imageUrl',
  'videoUrl',
  'instruction',
  'muscleValues',
  'categories',
  'equipment',
  'prescriptions',
  'patterns',
  'bodyRegions',
  'loadingSides',
  'movementDirections',
  'locations',
  'liftPriorities',
] as const) {}

export class UpsertManyExercisesDto {
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseDto)
  @ApiProperty({ type: () => CreateExerciseDto, isArray: true })
  @Expose()
  exercises: CreateExerciseDto[];
}
