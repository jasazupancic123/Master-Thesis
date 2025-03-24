export interface SetExerciseOption {
  type: 'select' | 'string' | 'number';
  label: string;
  values?: string[];
  format: (value: string) => string;
}

function getValues(length: number, hop: number = 1, allowZero = false) {
  const values = new Array(length)
    .fill(0)
    .map((_, i) => ((i + 1) * hop).toString());

  return allowZero ? ['0', ...values] : ['', ...values];
}

export const SET_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'set',
  values: getValues(10),
  format: (value) => value,
};

export const REP_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'rep',
  values: getValues(20),
  format: (value) => value,
};

export const DISTANCE_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'dist',
  values: getValues(36, 5),
  format: (value) => `${value} m`,
};

export const TIME_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'time',
  values: getValues(36, 5),
  format: (value) => `${value} s`,
};

export const VO2_OPTIONS: SetExerciseOption = {
  type: 'string',
  label: 'vo2',
  format: (value) => value,
};

export const RM_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'rm',
  values: getValues(15, 1),
  format: (value) => `${value} RM`,
};

export const BW_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'bw',
  values: getValues(25, 10),
  format: (value) => `${value} %`,
};

export const INT_OPTIONS: SetExerciseOption = {
  type: 'number',
  label: 'int',
  format: (value) => value,
};

export const KG_OPTIONS: SetExerciseOption = {
  type: 'number',
  label: 'kg',
  values: getValues(300, 1, true),
  format: (value) => value,
};

export const TEMPO_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'temp',
  values: ['0:0:0', '1:0:1', '2:0:1', '1:1:1', '1:2:1', '3:0:1'],
  format: (value) => value,
};

export const EFFORT_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'eff',
  values: ['easy', 'mod', 'hard', 'max'],
  format: (value) => value,
};

export const REC_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'rec',
  values: getValues(36, 5),
  format: (value) => `${value} s`,
};

export const WORKLOAD = [RM_OPTIONS, BW_OPTIONS, KG_OPTIONS];
export const TEMPO = [TEMPO_OPTIONS, EFFORT_OPTIONS];
export const RECOVERY = [REC_OPTIONS];
export const SET = [SET_OPTIONS];
export const SET_TYPE = [REP_OPTIONS, DISTANCE_OPTIONS, TIME_OPTIONS];
