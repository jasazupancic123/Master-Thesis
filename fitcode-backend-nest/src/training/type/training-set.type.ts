import type { ExerciseSet } from '../entity/exercise-set.entity';

export type DefinedExerciseSet = Required<
  Omit<ExerciseSet, 'setNumber' | 'loadType' | 'tempo' | 'tempoR'>
> & {
  tempo: number; // in seconds
  tempoR: number; // in seconds
};

export interface SetReport {
  reps: number;
  load: number;
  tonnage: number;
  tit: number; // time under tension
  time: number;
  dist: number;
  recTime: number;
  recDist: number;
}
