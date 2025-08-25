import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { Exercise } from './exercise.type';

export type MuscleTip = {
  show: boolean;
  x: number;
  y: number;
  id?: string;
  name?: string;
  componentExercises: TrainingExercise[];
  possibleExercises: Exercise[];
  focus: boolean;
};
