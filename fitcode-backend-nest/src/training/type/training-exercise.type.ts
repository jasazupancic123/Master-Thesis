import { TrainingExercise } from '../entity/training-exercise.entity';
import { Training } from '../entity/training.entity';

/* NOTE - when creating an exercise, order is automatically deduced from the last order */
export type CreateTrainingExercise = Pick<TrainingExercise, 'meta' | 'color'>;

export type UpdateTrainingExercise = Partial<
  Pick<TrainingExercise, 'meta' | 'color' | 'order'>
>;
