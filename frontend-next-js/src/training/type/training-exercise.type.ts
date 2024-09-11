import { TrainingExercise } from '@/training/entity/training-exercise.entity';

export type CreateTrainingExercise = Pick<TrainingExercise, 'exerciseId' | 'order' | 'color' | 'meta'> & {
  exercisesIds: string[];
}

export type UpdateTrainingExercise = Partial<CreateTrainingExercise>;