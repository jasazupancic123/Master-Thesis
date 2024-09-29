import { TrainingExercise } from '../entity/training-exercise.entity';
import { Training } from '../entity/training.entity';

export type CreateTrainingExercise = Pick<Training, 'membersIds'> &
  Pick<TrainingExercise, 'exerciseId' | 'meta' | 'color'>;

export type UpdateTrainingExercise = Partial<
  Pick<TrainingExercise, 'meta' | 'color' | 'order'>
>;
