import { PickType } from '@nestjs/mapped-types';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AddTrainingExercise extends PickType(TrainingExercise, ['exerciseId', 'order', 'color', 'meta']) {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  exercisesIds: string[];
}