import type {
  TrainingExercise,
  TrainingExerciseRecording,
  UpdateTrainingExercise,
} from './training-exercise.type';

export type Superset = {
  exercises: TrainingExercise[];
};

<<<<<<< HEAD
export type UpdateSuperset = {
=======
export type SupersetRecording = ColorEntity & {
  exercises: TrainingExerciseRecording[];
};

export type UpdateSuperset = Pick<Superset, 'color'> & {
>>>>>>> main
  exercises: UpdateTrainingExercise[];
};
