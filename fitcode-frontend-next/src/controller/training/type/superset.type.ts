import type {
  TrainingExercise,
  TrainingExerciseRecording,
  UpdateTrainingExercise,
} from './training-exercise.type';

export type Superset = {
  exercises: TrainingExercise[];
};

export type UpdateSuperset = {
  exercises: UpdateTrainingExercise[];
};

export type SupersetRecording = {
  exercises: TrainingExerciseRecording[];
};
