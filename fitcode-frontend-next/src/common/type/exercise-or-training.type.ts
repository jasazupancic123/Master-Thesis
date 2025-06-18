export enum ExerciseTrainingView {
  ExerciseView = 'exercise',
  TrainingView = 'training',
}
export type ExerciseOrTraining =
  (typeof ExerciseTrainingView)[keyof typeof ExerciseTrainingView];
