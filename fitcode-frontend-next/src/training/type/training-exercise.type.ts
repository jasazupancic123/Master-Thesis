import { TrainingExercise } from '@/training/entity/training-exercise.entity';
import { TrainingExerciseMeta } from '@/training/entity/training-exercise-meta.entity';
import { TrainingExerciseUserData } from '@/training/entity/training-exercise-user-data.entity';

export type CreateTrainingExercise = Partial<
  Pick<TrainingExercise, 'id' | 'order' | 'color' | 'meta'>
>;

export type UpdateTrainingExercise = Partial<
  Omit<CreateTrainingExercise, 'meta'> & {
    meta: Partial<TrainingExerciseMeta>;
  }
>;

export type UpdateTrainingExerciseUserData =
  Partial<TrainingExerciseUserData>[];
