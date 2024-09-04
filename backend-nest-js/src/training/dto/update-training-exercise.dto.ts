import { PartialType, PickType } from '@nestjs/mapped-types';
import { TrainingExercise } from '../entity/training-exercise.entity';

export class UpdateTrainingExerciseDto extends PartialType(PickType(TrainingExercise, [
  'order',
  'color',
  'meta',
] as const)) {
}