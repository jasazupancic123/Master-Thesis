import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeType } from '@src/attribute/enum/attribute-type.enum';
import type {
  ExerciseParamField,
  ExerciseSet,
} from '@src/training/entity/exercise-set.entity';

const REPS: Attribute<ExerciseSet> = {
  field: 'reps',
  name: 'Reps',
  description: 'repetitions',
  type: AttributeType.Number,
  defaultValue: 10,
};

const REC_TIME: Attribute<ExerciseSet> = {
  field: 'recTime',
  name: 'Rec Time',
  description: 'recovery time between sets',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: 60,
};

const REC_DIST: Attribute<ExerciseSet> = {
  field: 'recDist',
  name: 'Rec Distance',
  description: 'recovery distance between intervals',
  unit: 'm',
  type: AttributeType.Number,
  defaultValue: 100,
};

const KG: Attribute<ExerciseSet> = {
  field: 'loadKg',
  name: 'Load',
  description: 'load',
  unit: 'kg',
  type: AttributeType.Number,
  defaultValue: 50,
};

const BW: Attribute<ExerciseSet> = {
  field: 'loadBw',
  name: 'Load',
  description: 'load',
  unit: '%',
  type: AttributeType.Number,
  defaultValue: 50,
};

const RM: Attribute<ExerciseSet> = {
  field: 'loadRm',
  name: 'Load',
  description: 'load',
  type: AttributeType.Number,
  defaultValue: 75,
};

const TEMPO_ECC: Attribute<ExerciseSet> = {
  field: 'tempoEcc',
  name: 'Tempo (Eccentric)',
  description: 'tempo ecc',
  type: AttributeType.Number,
  defaultValue: 2,
};

const TEMPO_ISO: Attribute<ExerciseSet> = {
  field: 'tempoIso',
  name: 'Tempo (Isometric)',
  description: 'tempo iso',
  type: AttributeType.Number,
  defaultValue: 0,
};

const TEMPO_CON: Attribute<ExerciseSet> = {
  field: 'tempoCon',
  name: 'Tempo (Concentric)',
  description: 'tempo con',
  type: AttributeType.Number,
  defaultValue: 1,
};

const TEMPO_IDLE: Attribute<ExerciseSet> = {
  field: 'tempoIdle',
  name: 'Tempo (Idle)',
  description: 'tempo idle',
  type: AttributeType.Number,
  defaultValue: 0,
};

const PACE: Attribute<ExerciseSet> = {
  field: 'pace',
  name: 'Pace',
  description: 'pace',
  unit: 's/km',
  type: AttributeType.Number,
  defaultValue: 300, // 5 min/km
};

const WATTS: Attribute<ExerciseSet> = {
  field: 'watts',
  name: 'Watts',
  description: 'power output',
  unit: 'W',
  type: AttributeType.Number,
  defaultValue: 300, // 5 min/km
};

const TIME: Attribute<ExerciseSet> = {
  field: 'time',
  name: 'Time',
  description: 'time',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: 60,
};

const DIST: Attribute<ExerciseSet> = {
  field: 'dist',
  name: 'Distance',
  description: 'distance',
  unit: 'm',
  type: AttributeType.Number,
  defaultValue: 30,
};

const EFF: Attribute<ExerciseSet> = {
  field: 'eff',
  name: 'Effort',
  description: 'effort',
  type: AttributeType.Number,
  defaultValue: 2,
  min: 1, // easy
  max: 4, // max
};

const VEL: Attribute<ExerciseSet> = {
  field: 'vel',
  name: 'VBT',
  description: 'velocity based training',
  unit: 'm/s',
  type: AttributeType.Number,
  defaultValue: 1,
};

export const ExerciseParamAttribute: Record<
  ExerciseParamField,
  Attribute<ExerciseSet>
> = {
  reps: REPS,
  repsR: REPS,
  loadKg: KG,
  loadKgR: KG,
  loadBw: BW,
  loadBwR: BW,
  loadRm: RM,
  loadRmR: RM,
  tempoEcc: TEMPO_ECC,
  tempoIso: TEMPO_ISO,
  tempoCon: TEMPO_CON,
  tempoIdle: TEMPO_IDLE,
  tempoEccR: TEMPO_ECC,
  tempoIsoR: TEMPO_ISO,
  tempoConR: TEMPO_CON,
  tempoIdleR: TEMPO_IDLE,
  pace: PACE,
  paceR: PACE,
  watts: WATTS,
  wattsR: WATTS,
  vel: VEL,
  velR: VEL,
  time: TIME,
  timeR: TIME,
  dist: DIST,
  distR: DIST,
  eff: EFF,
  effR: EFF,
  recTime: REC_TIME,
  recTimeR: REC_TIME,
  recDist: REC_DIST,
  recDistR: REC_DIST,
};
