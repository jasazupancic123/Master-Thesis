import { TrainingExercise } from '@/training/entity/training-exercise.entity';
import { TrainingExerciseMeta } from '@/training/entity/training-exercise-meta.entity';

export type CreateTrainingExercise = Partial<Pick<TrainingExercise, 'exerciseId' | 'color' | 'meta'>>

export type UpdateTrainingExercise = Partial<Omit<CreateTrainingExercise, 'meta'> & {
  meta: Partial<TrainingExerciseMeta>
}>;