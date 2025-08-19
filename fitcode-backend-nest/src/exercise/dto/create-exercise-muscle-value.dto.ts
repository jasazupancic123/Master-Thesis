import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { Exercise } from '../entity/exercise.entity';

export class CreateExerciseMuscleValueDto extends PickType(Exercise, [
  'name',
  'muscleValues',
] as const) {}

export class UpsertManyExerciseMuscleValuesDto {
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseMuscleValueDto)
  @ApiProperty({ type: () => CreateExerciseMuscleValueDto, isArray: true })
  @Expose()
  exercises: CreateExerciseMuscleValueDto[];
}
