import type { TrainingExercise } from './training-exercise.type';

export type CompletedTrainingExercise = Pick<
  TrainingExercise,
  'id' | 'sets'
> & {
  supersetIndex?: number;
};

export type CompletedTrainingComponent = {
  userId: string;
  exercises: CompletedTrainingExercise[];
};
