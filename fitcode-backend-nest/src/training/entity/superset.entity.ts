import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ColorEntity } from '../../common/entity/color.entity';
import { TrainingExercise } from './training-exercise.entity';

export class Superset extends ColorEntity {
  @ValidateNested({ each: true })
  @Type(() => TrainingExercise)
  @ApiProperty()
  @Expose()
  exercises: TrainingExercise[];
}
