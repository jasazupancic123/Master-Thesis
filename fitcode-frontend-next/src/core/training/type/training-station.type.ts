import { AuthUser } from '@/core/auth/type/user.type';
import { TrainingExercise } from './training-exercise.type';

export type TrainingStation = {
  id: string;
  name: string;
  color: string;
  trainingId: string;
  componentId: string;
  exercises: TrainingExercise[];
  users: AuthUser[];
};
