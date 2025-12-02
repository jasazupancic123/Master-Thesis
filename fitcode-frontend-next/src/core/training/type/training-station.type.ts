import type { TrainingExercise } from './training-exercise.type';
import type { AuthUser } from '@/core/auth/type/user.type';

export type TrainingStation = {
  id: string;
  name: string;
  color: string;
  trainingId: string;
  componentId: string;
  exercises: TrainingExercise[];
  users: AuthUser[];
};
