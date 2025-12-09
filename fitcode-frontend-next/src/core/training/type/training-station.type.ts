import type { TrainingExercise } from './training-exercise.type';
import type { User } from '@/core/user/type/user.type';

export type TrainingStation = {
  id: string;
  name: string;
  color: string;
  trainingId: string;
  componentId: string;
  exercises: TrainingExercise[];
  users: User[];
};
