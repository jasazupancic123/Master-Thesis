import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeType } from '@src/common/enum/attribute-type.enum';

export const DEFAULT_PARAMS_KEY = 'default';

export const DEFAULT_REC_TIME: Attribute = {
  field: 'recTime',
  name: 'Rec Time',
  description: 'recovery time between sets',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: '60',
};

export const DEFAULT_REC_DIST: Attribute = {
  field: 'recDist',
  name: 'Rec Distance',
  description: 'recovery distance between intervals',
  unit: 'm',
  type: AttributeType.Number,
  defaultValue: '100',
};

export const DEFAULT_REP_ATTR: Attribute = {
  field: 'reps',
  name: 'Reps',
  description: 'repetitions',
  type: AttributeType.Number,
  defaultValue: '10',
};

export const DEFAULT_LOAD_KG_ATTR: Attribute = {
  field: 'loadKg',
  name: 'Load',
  description: 'load',
  unit: 'kg',
  type: AttributeType.Number,
  defaultValue: '50',
};

export const DEFAULT_LOAD_BW_ATTR: Attribute = {
  field: 'loadBw',
  name: 'Load',
  description: 'load',
  unit: '%',
  type: AttributeType.Number,
  defaultValue: '50',
};

export const DEFAULT_LOAD_RM_ATTR: Attribute = {
  field: 'loadRm',
  name: 'Load',
  description: 'load',
  type: AttributeType.Number,
  defaultValue: '75',
};

export const DEFAULT_TEMPO_ATTR: Attribute = {
  field: 'tempo',
  name: 'Tempo',
  description: 'tempo',
  type: AttributeType.String,
  defaultValue: '2:0:1:0',
  pattern: '^[0-9]+:[0-9]+:[0-9]+:[0-9]+$', // e.g. "2:0:1:0", meaning "eccentric:isometric:concentric:isometric" in seconds
};

export const DEFAULT_TIME_ATTR: Attribute = {
  field: 'time',
  name: 'Time',
  description: 'time',
  unit: 's',
  type: AttributeType.Number,
  defaultValue: '60',
};

export const DEFAULT_DIST_ATTR: Attribute = {
  field: 'dist',
  name: 'Distance',
  description: 'distance',
  unit: 'm',
  type: AttributeType.Number,
  defaultValue: '30',
};

export const DEFAULT_EFFORT_ATTR: Attribute = {
  field: 'eff',
  name: 'Effort',
  description: 'effort',
  type: AttributeType.Number,
  defaultValue: '2',
  min: 1, // easy
  max: 4, // max
};

export const DEFAULT_VBT_ATTR: Attribute = {
  field: 'vbt',
  name: 'VBT',
  description: 'velocity based training',
  unit: 'm/s',
  type: AttributeType.Number,
  defaultValue: '1',
};

export const PARAMS: Attribute[] = [
  DEFAULT_REC_TIME,
  DEFAULT_REC_DIST,
  DEFAULT_REP_ATTR,
  DEFAULT_LOAD_KG_ATTR,
  DEFAULT_LOAD_BW_ATTR,
  DEFAULT_LOAD_RM_ATTR,
  DEFAULT_TEMPO_ATTR,
  DEFAULT_TIME_ATTR,
  DEFAULT_DIST_ATTR,
  DEFAULT_EFFORT_ATTR,
  DEFAULT_VBT_ATTR,
];
