import { TEMPO_REGEX } from './tempo-regex.constant';
import { AttributeType } from '@/core/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import type { ExerciseSet } from '@/core/training/type/exercise-set.type';

export type ExerciseSetParamsObj = Omit<
  ExerciseSet,
  'setNumber' | 'loadType'
> & { sets: number };

export const SETS: Attribute<ExerciseSetParamsObj> = {
  field: 'sets',
  type: AttributeType.Number,
  name: 'Set',
  defaultValue: 3,
  min: 1,
  max: 10,
};

export const REPS: Attribute<ExerciseSetParamsObj> = {
  field: 'reps',
  name: 'Reps',
  description: 'repetitions',
  type: AttributeType.Number,
  defaultValue: 10,
  min: 0,
  max: 100,
  required: true,
};

export const REC_TIME: Attribute<ExerciseSetParamsObj> = {
  field: 'recTime',
  name: 'Time',
  description: 'recovery time between sets',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: 60, // in seconds
  min: 0,
  max: 600, // 10 minutes
};

export const REC_DIST: Attribute<ExerciseSetParamsObj> = {
  field: 'recDist',
  name: 'Dist',
  description: 'recovery distance between intervals',
  unit: 'm',
  type: AttributeType.Number,
  defaultValue: 100, // in meters
  min: 0,
  max: 100000, // 100 km
};

export const KG: Attribute<ExerciseSetParamsObj> = {
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

export const BW: Attribute<ExerciseSetParamsObj> = {
  field: 'loadBw',
  name: 'BW',
  description: 'load',
  unit: '%',
  type: AttributeType.Number,
  defaultValue: 50,
  min: 0,
  max: 500,
};

export const RM: Attribute<ExerciseSetParamsObj> = {
  field: 'loadRm',
  name: 'RM',
  description: 'load',
  type: AttributeType.Number,
  defaultValue: 75,
  min: 1,
  max: 500,
};

export const TEMPO: Attribute<ExerciseSetParamsObj> = {
  field: 'tempo',
  name: 'Tempo',
  description: 'tempo',
  type: AttributeType.String,
  defaultValue: '2:0:1:0',
  pattern: TEMPO_REGEX, // e.g. "2:0:1:0", meaning "eccentric:isometric:concentric:isometric" in seconds
};

export const TIME: Attribute<ExerciseSetParamsObj> = {
  field: 'time',
  name: 'Time',
  description: 'time',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: 60, // in seconds
  min: 1,
  max: 600, // 10 minutes
};

export const DIST: Attribute<ExerciseSetParamsObj> = {
  field: 'dist',
  type: AttributeType.Number,
  name: 'Distance',
  description: 'distance',
  unit: 'm',
  defaultValue: 100,
  min: 1,
  max: 100000, // 100 km
};

export const EFF: Attribute<ExerciseSetParamsObj> = {
  field: 'eff',
  name: 'Effort',
  description: 'effort',
  type: AttributeType.Number,
  defaultValue: 2,
  min: 1, // easy
  max: 4, // max
};

export const VEL: Attribute<ExerciseSetParamsObj> = {
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
