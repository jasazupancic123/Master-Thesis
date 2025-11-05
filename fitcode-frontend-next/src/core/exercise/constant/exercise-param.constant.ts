import { AttributeType } from '@/core/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';

export const SETS: Attribute = {
  field: 'sets',
  type: AttributeType.Number,
  name: 'Set',
  defaultValue: 3,
  min: 1,
  max: 10,
};

export const REPS: Attribute<ExerciseSet> = {
  field: 'reps',
  name: 'Rep',
  description: 'repetitions',
  type: AttributeType.Number,
  defaultValue: 10,
  min: 0,
  max: 100,
  required: true,
};

export const REC_TIME: Attribute<ExerciseSet> = {
  field: 'recTime',
  name: 'Rec',
  description: 'recovery time between sets',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: 60, // in seconds
  min: 0,
  max: 600, // 10 minutes
};

export const REC_DIST: Attribute<ExerciseSet> = {
  field: 'recDist',
  name: 'Dist',
  description: 'recovery distance between intervals',
  unit: 'm',
  type: AttributeType.Number,
  defaultValue: 100, // in meters
  min: 0,
  max: 100000, // 100 km
};

export const KG: Attribute<ExerciseSet> = {
  field: 'loadKg',
  name: 'KG',
  description: 'load',
  unit: 'kg',
  type: AttributeType.Number,
  defaultValue: 50,
  float: true,
  min: 0,
  max: 999,
};

export const BW: Attribute<ExerciseSet> = {
  field: 'loadBw',
  name: 'BW',
  description: 'load',
  unit: '%',
  type: AttributeType.Number,
  defaultValue: 50,
  min: 0,
  max: 500,
};

export const RM: Attribute<ExerciseSet> = {
  field: 'loadRm',
  name: 'RM',
  description: 'load',
  type: AttributeType.Number,
  defaultValue: 75,
  min: 1,
  max: 500,
};

export const TEMPO_ECC: Attribute<ExerciseSet> = {
  field: 'tempoEcc',
  name: 'Tempo (Eccentric)',
  description: 'tempo ecc',
  type: AttributeType.Number,
  defaultValue: 2,
};

export const TEMPO_ISO: Attribute<ExerciseSet> = {
  field: 'tempoIso',
  name: 'Tempo (Isometric)',
  description: 'tempo iso',
  type: AttributeType.Number,
  defaultValue: 0,
};

export const TEMPO_CON: Attribute<ExerciseSet> = {
  field: 'tempoCon',
  name: 'Tempo (Concentric)',
  description: 'tempo con',
  type: AttributeType.Number,
  defaultValue: 1,
};

export const TEMPO_IDLE: Attribute<ExerciseSet> = {
  field: 'tempoIdle',
  name: 'Tempo (Idle)',
  description: 'tempo idle',
  type: AttributeType.Number,
  defaultValue: 0,
};

export const TIME: Attribute<ExerciseSet> = {
  field: 'time',
  name: 'Time',
  description: 'time',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: 60, // in seconds
  min: 1,
  max: 600, // 10 minutes
};

export const DIST: Attribute<ExerciseSet> = {
  field: 'dist',
  type: AttributeType.Number,
  name: 'Dist',
  description: 'distance',
  unit: 'm',
  defaultValue: 100,
  min: 1,
  max: 100000, // 100 km
};

export const EFF: Attribute<ExerciseSet> = {
  field: 'eff',
  name: 'Effort',
  description: 'effort',
  type: AttributeType.Number,
  defaultValue: 2,
  min: 1, // easy
  max: 4, // max
};

export const VEL: Attribute<ExerciseSet> = {
  field: 'vel',
  name: 'VBT',
  description: 'velocity based training',
  unit: 'm/s',
  type: AttributeType.Number,
  defaultValue: 0.5,
  min: 0.1,
  max: 5,
  float: true,
};

export const EFF_OPTIONS = ['Easy', 'Mod', 'Hard', 'Max'];
