import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { CreateExerciseDto } from './create-exercise.dto';

export class CreateExercisesDto {
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseDto)
  @ApiProperty()
  @Expose()
  exercises: CreateExerciseDto[];
}
