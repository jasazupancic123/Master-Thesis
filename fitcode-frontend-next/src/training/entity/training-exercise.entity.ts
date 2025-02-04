import { Exercise } from '@/exercise/entity/exercise.entity';
import { TrainingExerciseMeta } from '@/training/entity/training-exercise-meta.entity';
import { TrainingExerciseUserData } from '@/training/entity/training-exercise-user-data.entity';

export type TrainingExercise = {
  id: string;
  exercise: Exercise | null;
  order: number;
  color: string;
  meta: TrainingExerciseMeta;
  data: TrainingExerciseUserData[];
};
