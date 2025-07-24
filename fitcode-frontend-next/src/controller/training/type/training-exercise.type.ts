import { IdEntity, ColorEntity } from '@/common/type/entity.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { ExerciseSet } from './exercise-set.type';

export type TrainingExercise = IdEntity &
  ColorEntity & {
    params: Attribute[];
    sets: ExerciseSet[];
    attributes: Attribute[];

    // mapped properties
    exercise?: Exercise;
  };
