import { Exercise } from '@/exercise/type/exercise.type';
import { TrainingExerciseMeta } from '@/training/entity/training-exercise-meta.entity';
import { TrainingExerciseUserData } from '@/training/entity/training-exercise-user-data.entity';

export type TrainingExercise = {
  exerciseId: string;
  exercise: Exercise | null;
  order: number;
  color: string;
  meta: TrainingExerciseMeta;
  data: TrainingExerciseUserData[];
}