import type { TrainingExercise } from '../entity/training-exercise.entity';

export type SmartWallTraining = {
  trainingId: string;
  users: { uid: string; exercises: TrainingExercise[] }[];
};
