import { PickType } from '@nestjs/mapped-types';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { CreateTrainingExercise } from '../type/training-exercise.type';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddTrainingExerciseDto
  extends PickType(TrainingExercise, ['exerciseId', 'meta', 'color'])
  implements CreateTrainingExercise {}

export class AddTrainingExercisesDto {
  @ValidateNested({ each: true })
  @Type(() => AddTrainingExerciseDto)
  @ApiProperty()
  @Expose()
  exercises: AddTrainingExerciseDto[];
}
