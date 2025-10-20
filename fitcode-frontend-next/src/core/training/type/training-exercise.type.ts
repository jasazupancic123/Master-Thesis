import type { ExerciseParamField, ExerciseSet } from './exercise-set.type';
import type { IdEntity } from '@/core/entity.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { RepInfo } from '@/core/pose-detection/type/rep.type';

export type TrainingExercise = IdEntity & {
  params: ExerciseParamField[];
  sets: ExerciseSet[];

  // mapped properties
  exercise?: Exercise;
};

export type UpdateTrainingExercise = Pick<TrainingExercise, 'id' | 'sets'>;

export type RepImage = {
  repNumber: number;
  url: string;
};

export type TrainingExerciseRecording = TrainingExercise & {
  recordedSets?: {
    setIndex: number;
    reps: RepInfo[];
    images: RepImage[];
  }[];
};
