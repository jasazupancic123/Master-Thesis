import { PartialType, PickType } from '@nestjs/mapped-types';
import { TrainingExercise } from '../entity/training-exercise.entity';

export class AddTrainingExercise extends PartialType(
  PickType(TrainingExercise, ['exerciseId', 'order', 'color', 'meta']),
) {}
