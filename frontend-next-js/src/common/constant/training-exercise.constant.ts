export interface SetExerciseOption {
  type: 'select' | 'string' | 'number',
  label: string,
  values?: string[];
  format: (value: string) => string;
}

function getValues(length: number, hop: number = 1) {
  const values = new Array(length).fill(0).map((_, i) => ((i + 1) * hop).toString());
  return [''].concat(values);
}

const SET_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'sets',
  values: getValues(10),
  format: (value) => value,
};

const REP_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'reps',
  values: getValues(20),
  format: (value) => value,
};

const DISTANCE_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'distance',
  values: getValues(36, 5),
  format: (value) => `${value} m`,
};

const TIME_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'time',
  values: getValues(36, 5),
  format: (value) => `${value} s`,
};

const VO2_OPTIONS: SetExerciseOption = {
  type: 'string',
  label: 'vo2',
  format: (value) => value,
};

const RM_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'rm',
  values: getValues(15, 1),
  format: (value) => `${value} RM`,
};

const BW_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'bw',
  values: getValues(25, 10),
  format: (value) => `${value} %`,
};

const INT_OPTIONS: SetExerciseOption = {
  type: 'number',
  label: 'int',
  format: (value) => value,
};

const KG_OPTIONS: SetExerciseOption = {
  type: 'number',
  label: 'kg',
  format: (value) => value,
};

const TEMPO_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'tempo',
  values: ['0:0:0', '1:0:1', '2:0:1', '1:1:1', '1:2:1', '3:0:1'],
  format: (value) => value,
};

const EFFORT_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'effort',
  values: ['easy', 'moderate', 'hard', 'max'],
  format: (value) => value,
};

const REC_OPTIONS: SetExerciseOption = {
  type: 'select',
  label: 'rec',
  values: getValues(36, 5),
  format: (value) => `${value} s`,
};

export const TRAINING_EXERCISE_SET = [SET_OPTIONS];
export const TRAINING_EXERCISE_SET_TYPE = [REP_OPTIONS, DISTANCE_OPTIONS, TIME_OPTIONS, VO2_OPTIONS];
export const TRAINING_EXERCISE_WORKLOAD = [RM_OPTIONS, BW_OPTIONS, INT_OPTIONS, KG_OPTIONS];
export const TRAINING_EXERCISE_EFFORT = [EFFORT_OPTIONS];
export const TRAINING_EXERCISE_TEMPO = [TEMPO_OPTIONS];
export const TRAINING_EXERCISE_RECOVERY = [REC_OPTIONS];