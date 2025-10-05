import type {
  TrainingExercise,
  TrainingExerciseRecording,
  UpdateTrainingExercise,
} from './training-exercise.type';
import type { ColorEntity } from '@/common/type/entity.type';

export type Superset = ColorEntity & {
  exercises: TrainingExercise[];
};

export type SupersetRecording = ColorEntity & {
  exercises: TrainingExerciseRecording[];
};

export type UpdateSuperset = Pick<Superset, 'color'> & {
  exercises: UpdateTrainingExercise[];
};
