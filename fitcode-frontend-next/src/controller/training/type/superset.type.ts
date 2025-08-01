import { ColorEntity } from '@/common/type/entity.type';
import {
  TrainingExercise,
  UpdateTrainingExercise,
} from './training-exercise.type';

export type Superset = ColorEntity & {
  exercises: TrainingExercise[];
};

export type UpdateSuperset = Pick<Superset, 'color'> & {
  exercises: UpdateTrainingExercise[];
};
