import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { TrainingExercise } from './training-exercise.entity';

export class Superset {
  @ValidateNested({ each: true })
  @Type(() => TrainingExercise)
  @ApiProperty({ type: () => TrainingExercise, isArray: true })
  @Expose()
  exercises: TrainingExercise[];
}
