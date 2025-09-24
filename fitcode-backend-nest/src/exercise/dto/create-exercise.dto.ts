import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';

import { Exercise } from '../entity/exercise.entity';

export class CreateExerciseDto extends PickType(Exercise, [
  'name',
  'componentIds',
  'isUnilateral',
  'imageUrl',
  'videoUrl',
  'instruction',
  'muscleValues',
] as const) {
  @ValidateNested({ each: true })
  @Type(() => AttributeValue)
  @ApiProperty({ type: () => AttributeValue, isArray: true })
  @Expose()
  attributeValues: AttributeValue[];
}

export class UpsertManyExercisesDto {
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseDto)
  @ApiProperty({ type: () => CreateExerciseDto, isArray: true })
  @Expose()
  exercises: CreateExerciseDto[];
}
