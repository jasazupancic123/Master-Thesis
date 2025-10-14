import type { ExerciseSet } from './exercise-set.type';
import type { IdEntity } from '@/common/type/entity.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { RepInfo } from '@/controller/pose-detection/type/rep.type';

export type TrainingExercise = IdEntity & {
  params: (keyof ExerciseSet)[];
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
