import type { ExerciseSet } from '@src/training/entity/exercise-set.entity';

export const COMPONENT_PARAMS_OPT1: (keyof ExerciseSet)[] = [
  'reps',
  'loadKg',
] as const;

export const COMPONENT_PARAMS_OPT2: (keyof ExerciseSet)[] = [
  'dist',
  'tempo',
  'eff',
] as const;
