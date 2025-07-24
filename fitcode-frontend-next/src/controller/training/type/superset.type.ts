import { ColorEntity } from '@/common/type/entity.type';
import { TrainingExercise } from './training-exercise.type';

export type Superset = ColorEntity & {
  exercises: TrainingExercise[];
};
