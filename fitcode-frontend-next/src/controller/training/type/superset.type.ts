import type {
  TrainingExercise,
  UpdateTrainingExercise,
} from './training-exercise.type';

export type Superset = {
  exercises: TrainingExercise[];
};

export type UpdateSuperset = {
  exercises: UpdateTrainingExercise[];
};
