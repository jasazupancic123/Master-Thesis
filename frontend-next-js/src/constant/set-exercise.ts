export interface SetExerciseOption {
  type: 'select' | 'string' | 'number',
  label: string,
  values?: string[] | number[]
}

export const SET_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'sets',
  values: new Array(10).fill(0).map((_, i) => (i + 1).toString()),
};

export const REP_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'reps',
  values: new Array(20).fill(0).map((_, i) => (i + 1).toString()),
};

export const DISTANCE_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'distance',
  values: new Array(36).fill(0).map((_, i) => `${(i + 1) * 5} m`),
};

export const TIME_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'time',
  values: new Array(36).fill(0).map((_, i) => `${(i + 1) * 5} s`),
};

export const VO2_OPTIONS: SetExerciseOption = {
  type: 'string',
  label: 'vo2',
};

export const RM_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'rm',
  values: new Array(15).fill(0).map((_, i) => `${(i + 1)} RM`),
};

export const BW_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'bw',
  values: new Array(25).fill(0).map((_, i) => `${(i + 1) * 10} %`),
};

export const INT_OPTIONS: SetExerciseOption = {
  type: 'number',
  label: 'int',
};

export const KG_OPTIONS: SetExerciseOption = {
  type: 'number',
  label: 'kg',
};

export const TEMPO_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'tempo',
  values: ['0:0:0', '1:0:1', '2:0:1', '1:1:1', '1:2:1', '3:0:1'],
};

export const EFFORT_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'effort',
  values: ['easy', 'moderate', 'hard', 'max'],
};

export const REC_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'rec',
  values: new Array(36).fill(0).map((_, i) => `${(i + 1) * 5} s`),
};