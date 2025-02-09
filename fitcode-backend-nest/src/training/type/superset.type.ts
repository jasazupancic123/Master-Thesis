import { Superset } from '../entity/superset.entity';
import { CreateTrainingExercise } from './training-exercise.type';

export type CreateSuperset = Pick<Superset, 'color'> & {
  exercises?: CreateTrainingExercise;
};

export type UpdateSuperset = Partial<Pick<Superset, 'color' | 'order'>>;
