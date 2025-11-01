import { PickType } from '@nestjs/mapped-types';
import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { Exercise } from '../entity/exercise.entity';

export class CreateExerciseDto extends IntersectionType(
  PartialType(PickType(Exercise, ['params'] as const)), // if not provided, it takes component params
  PickType(Exercise, [
    'name',
    'components',
    'isUnilateral',
    'disabled',
    'imageUrl',
    'videoUrl',
    'instruction',
    'muscleValues',
    'components',
    'equipment',
    'prescriptions',
    'patterns',
    'bodyRegions',
    'loadingSides',
    'movementDirections',
    'locations',
    'liftPriorities',
  ] as const),
) {}

export class UpsertManyExercisesDto {
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseDto)
  @ApiProperty({ type: () => CreateExerciseDto, isArray: true })
  @Expose()
  exercises: CreateExerciseDto[];
}
