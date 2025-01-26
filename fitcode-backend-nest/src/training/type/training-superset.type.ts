import { TrainingSuperset } from '../entity/training-superset.entity';
import { CreateTrainingExercise } from './training-exercise.type';

export type CreateTrainingSuperset = Pick<TrainingSuperset, 'color'> & {
  exercises?: CreateTrainingExercise[];
};

export type UpdateTrainingSuperset = Partial<
  Pick<TrainingSuperset, 'color' | 'order'>
>;
