import type { Exercise } from './exercise.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';

export type MuscleTip = {
  show: boolean;
  x: number;
  y: number;
  id?: string;
  name?: string;
  cocentric?: number;
  isometric?: number;
  eccentric?: number;
  componentExercises?: TrainingExercise[];
  possibleExercises?: Exercise[];
  focus: boolean;
};
