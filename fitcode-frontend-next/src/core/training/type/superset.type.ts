import type {
  TrainingExercise,
  TrainingExerciseRecording,
  UpdateTrainingExercise,
} from './training-exercise.type';

export type Superset = {
  exercises: TrainingExercise[];
  warmup?: boolean;
  cooldown?: boolean;
};

export type UpdateSuperset = {
  exercises: UpdateTrainingExercise[];
};

export type SupersetRecording = {
  exercises: TrainingExerciseRecording[];
};
