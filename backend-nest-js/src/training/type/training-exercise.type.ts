import { TrainingExercise } from '../entity/training-exercise.entity';

export type CreateTrainingExercise = Pick<
  TrainingExercise,
  'exerciseId' | 'meta' | 'color'
>;

export type UpdateTrainingExercise = Partial<
  Pick<TrainingExercise, 'meta' | 'color' | 'order'>
>;
