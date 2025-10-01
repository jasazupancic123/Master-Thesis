import type { ExerciseSet } from './exercise-set.type';
import type { IdEntity } from '@/common/type/entity.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';

export type TrainingExercise = IdEntity & {
  params: Attribute[];
  sets: ExerciseSet[];
  attributes: Attribute[];

  // mapped properties
  exercise?: Exercise;
};

export type UpdateTrainingExercise = Pick<TrainingExercise, 'id' | 'sets'>;
