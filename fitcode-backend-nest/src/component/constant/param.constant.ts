import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { AttributeType } from '@src/common/enum/attribute-type.enum';

import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '../enum/param.enum';

export const DEFAULT_PARAMS_KEY = 'default';

export const TEMPO_REGEX = /^\d+(\.\d)?:\d+(\.\d)?:\d+(\.\d)?:\d+(\.\d)?$/;

export const VOL_WORK_SET_OPTIONS: Attribute[] = [
  {
    field: VolWorkSetType.Set,
    name: 'Set',
    type: AttributeType.Number,
    defaultValue: '3',
  },
];

export const VOL_OPTIONS: Attribute[] = [
  {
    field: VolType.Rep,
    name: 'Rep',
    description: 'reps',
    type: AttributeType.Number,
    defaultValue: '10',
  },
  {
    field: VolType.Time,
    name: 'Time',
    description: 'time',
    unit: 's',
    type: AttributeType.Number,
    defaultValue: '60',
  },
  {
    field: VolType.Dist,
    name: 'Dist',
    description: 'distance',
    unit: 'm',
    type: AttributeType.Number,
    defaultValue: '30',
  },
];

export const INT_OPTIONS: Attribute[] = [
  {
    field: IntType.Kg,
    name: 'KG',
    description: 'kilograms',
    unit: 'kg',
    type: AttributeType.Number,
    defaultValue: '50',
  },
  {
    field: IntType.Bw,
    name: 'BW',
    description: 'body weight',
    unit: '%',
    type: AttributeType.Number,
    defaultValue: '50',
  },
  {
    field: IntType.Rm,
    name: 'RM',
    description: 'rep max',
    type: AttributeType.Number,
    defaultValue: '75',
  },
  {
    field: IntType.Mas,
    name: 'MAS',
    description: 'max aerobic speed',
    unit: '%',
    type: AttributeType.Number,
    defaultValue: '100',
  },
  {
    field: IntType.Hrmax,
    name: 'HRMax',
    description: 'maximum heart rate',
    unit: '%',
    type: AttributeType.Number,
    defaultValue: '100',
  },
  {
    field: IntType.VBT,
    name: 'VBT',
    description: 'velocity based training',
    unit: 'm/s',
    type: AttributeType.Number,
    defaultValue: '1',
  },
  {
    field: IntType.Tempo,
    name: 'Tempo',
    description: 'tempo',
    type: AttributeType.String,
    defaultValue: '2:0:1:0',
    pattern: TEMPO_REGEX,
  },
  {
    field: IntType.Eff,
    name: 'Eff',
    description: 'effort',
    type: AttributeType.Number,
    defaultValue: '2',
    min: 1, // easy
    max: 4, // max
  },
];

export const PARAMS: Attribute[] = [
  {
    field: ParamType.VolWorkSets,
    name: 'Set',
    description: 'work sets',
    type: AttributeType.Select,
    options: VOL_WORK_SET_OPTIONS,
    defaultValue: VolWorkSetType.Set,
  },
  {
    field: ParamType.VolWork1,
    name: 'VO2',
    description: 'volume',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
    defaultValue: VolType.Rep,
  },
  {
    field: ParamType.VolWork2,
    name: 'VO2',
    description: 'volume',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
    defaultValue: VolType.Dist,
  },
  {
    field: ParamType.IntWork1,
    name: 'INT',
    description: 'intensity',
    type: AttributeType.Select,
    options: INT_OPTIONS,
    defaultValue: IntType.Kg,
  },
  {
    field: ParamType.IntWork2,
    name: 'INT',
    description: 'intensity',
    type: AttributeType.Select,
    options: INT_OPTIONS,
    defaultValue: IntType.Tempo,
  },
  {
    field: ParamType.VolRec1,
    name: 'Rec',
    description: 'volume recovery',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
    defaultValue: VolType.Time,
  },
  {
    field: ParamType.IntRec1,
    name: 'Rec',
    description: 'intensity recovery',
    type: AttributeType.Select,
    options: INT_OPTIONS,
    defaultValue: IntType.Eff,
  },
];
