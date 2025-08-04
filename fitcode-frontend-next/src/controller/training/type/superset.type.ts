import type {
  TrainingExercise,
  UpdateTrainingExercise,
} from './training-exercise.type';
import type { ColorEntity } from '@/common/type/entity.type';

export type Superset = ColorEntity & {
  exercises: TrainingExercise[];
};

export type UpdateSuperset = Pick<Superset, 'color'> & {
  exercises: UpdateTrainingExercise[];
};
