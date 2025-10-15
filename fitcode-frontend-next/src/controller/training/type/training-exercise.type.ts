import type { ExerciseSet } from './exercise-set.type';
import type { ColorEntity, IdEntity } from '@/common/type/entity.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { RepInfo } from '@/controller/pose-detection/type/rep.type';

export type TrainingExercise = IdEntity &
  ColorEntity & {
    params: Attribute[];
    sets: ExerciseSet[];
    attributes: Attribute[];

    // mapped properties
    exercise?: Exercise;
  };

export type RepImage = {
  repNumber: number;
  url: string;
};

export type TrainingExerciseRecording = TrainingExercise & {
  recordedSets?: TrainingExerciseRecordedSet[];
};

export type UpdateTrainingExercise = Pick<TrainingExercise, 'id' | 'sets'>;

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
