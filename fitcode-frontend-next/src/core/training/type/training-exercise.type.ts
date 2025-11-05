import type { ExerciseSet } from './exercise-set.type';
import type { IdEntity } from '@/core/entity.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { RepInfo } from '@/lib/pose-detection/type/rep.type';

export type TrainingExercise = IdEntity & {
  sets: ExerciseSet[];
  methodId?: string;

  // mapped properties
  exercise?: Exercise;
};

export type TrainingExerciseExtended = TrainingExercise & {
  componentId: string;
  supersetIndex: number;
};

export type UpdateTrainingExercise = Pick<
  TrainingExercise,
  'id' | 'sets' | 'methodId'
>;

export type RepImage = {
  repNumber: number;
  url: string;
  side?: 'L' | 'R';
};

export type TrainingExerciseRecording = TrainingExercise & {
  recordedSets?: TrainingExerciseRecordedSet[];
};

export type RepRomTimestamp = {
  value: number;
  timestamp: Date;
};

export type TrainingExerciseRecordedSet = {
  setIndex: number;
  repsL: RepInfo[];
  imagesL: RepImage[];
  repsR?: RepInfo[];
  imagesR?: RepImage[];
  romL?: RepRomTimestamp[];
  romR?: RepRomTimestamp[];
};
