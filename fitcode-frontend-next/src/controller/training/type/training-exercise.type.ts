import type { ExerciseSet } from './exercise-set.type';
import type { ColorEntity, IdEntity } from '@/common/type/entity.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { Rep } from '@/controller/pose-detection/type/rep.type';

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
  recordedSets?: {
    setIndex: number;
    reps: Rep[];
    images: RepImage[];
  }[];
};

export type UpdateTrainingExercise = Pick<TrainingExercise, 'id' | 'sets'>;
