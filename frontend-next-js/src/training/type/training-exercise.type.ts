import { TrainingExercise } from '@/training/entity/training-exercise.entity';

export type CreateTrainingExercise = Partial<Pick<TrainingExercise, 'exerciseId' | 'order' | 'color' | 'meta'>>

export type UpdateTrainingExercise = Partial<CreateTrainingExercise>;