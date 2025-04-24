import { AttributeType } from '../../common/enum/attribute-type.enum';
import { Attribute } from '../../attribute/entity/attribute.entity';
import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '../enum/param.enum';

export const DEFAULT_PARAMS_KEY = 'default';

export const VOL_WORK_SET_OPTIONS: Attribute[] = [
  {
    field: VolWorkSetType.Set,
    name: 'Set',
    type: AttributeType.Number,
    options: [],
    defaultValue: '3',
  },
];

export const VOL_OPTIONS: Attribute[] = [
  {
    field: VolType.Rep,
    name: 'Rep',
    type: AttributeType.Number,
    options: [],
    defaultValue: '12',
  },
  {
    field: VolType.Time,
    name: 'Time',
    type: AttributeType.Number,
    options: [],
    defaultValue: '30',
  },
  {
    field: VolType.Dist,
    name: 'Dist',
    type: AttributeType.Number,
    options: [],
    defaultValue: '30',
  },
];

export const INT_OPTIONS: Attribute[] = [
  {
    field: IntType.Kg,
    name: 'KG',
    unit: 'kg',
    type: AttributeType.Number,
    options: [],
    defaultValue: '20',
  },
  {
    field: IntType.Bw,
    name: 'BW',
    unit: '%',
    type: AttributeType.Number,
    options: [],
    defaultValue: '100',
  },
  {
    field: IntType.Rm,
    name: 'RM',
    type: AttributeType.Number,
    options: [],
    defaultValue: '10',
  },
  {
    field: IntType.Mas,
    name: 'MAS',
    unit: '%',
    type: AttributeType.Number,
    options: [],
    defaultValue: '100',
  },
  {
    field: IntType.Hrmax,
    name: 'HRMax',
    unit: '%',
    type: AttributeType.Number,
    options: [],
    defaultValue: '100',
  },
  {
    field: IntType.Tempo,
    name: 'Tempo',
    type: AttributeType.Select,
    defaultValue: '0',
    options: [
      {
        field: '0',
        name: '0:0:0',
        type: AttributeType.Value,
        options: [],
        defaultValue: '0',
      },
      {
        field: '1',
        name: '1:0:1',
        type: AttributeType.Value,
        options: [],
        defaultValue: '1',
      },
      {
        field: '2',
        name: '2:0:1',
        type: AttributeType.Value,
        options: [],
        defaultValue: '2',
      },
      {
        field: '3',
        name: '3:0:1',
        type: AttributeType.Value,
        options: [],
        defaultValue: '3',
      },
    ],
  },
  {
    field: IntType.Eff,
    name: 'Eff',
    type: AttributeType.Select,
    defaultValue: '0',
    options: [
      {
        field: '0',
        name: 'Easy',
        type: AttributeType.Value,
        options: [],
        defaultValue: '0',
      },
      {
        field: '1',
        name: 'Mod',
        type: AttributeType.Value,
        options: [],
        defaultValue: '1',
      },
      {
        field: '2',
        name: 'Hard',
        type: AttributeType.Value,
        options: [],
        defaultValue: '2',
      },
      {
        field: '3',
        name: 'Max',
        type: AttributeType.Value,
        options: [],
        defaultValue: '3',
      },
    ],
  },
];

export const PARAMS: Attribute[] = [
  {
    field: ParamType.VolWorkSets,
    name: 'Set',
    type: AttributeType.Select,
    options: VOL_WORK_SET_OPTIONS,
    defaultValue: VolWorkSetType.Set,
  },
  {
    field: ParamType.VolWork1,
    name: 'VO2',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
    defaultValue: VolType.Rep,
  },
  {
    field: ParamType.VolWork2,
    name: 'VO2',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
    defaultValue: VolType.Rep,
  },
  {
    field: ParamType.IntWork1,
    name: 'INT',
    type: AttributeType.Select,
    options: INT_OPTIONS,
    defaultValue: IntType.Kg,
  },
  {
    field: ParamType.IntWork2,
    name: 'INT',
    type: AttributeType.Select,
    options: INT_OPTIONS,
    defaultValue: IntType.Kg,
  },
  {
    field: ParamType.VolRec1,
    name: 'Rec',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
    defaultValue: VolType.Time,
  },
  {
    field: ParamType.IntRec1,
    name: 'Rec',
    type: AttributeType.Select,
    options: INT_OPTIONS,
    defaultValue: VolType.Time,
  },
];
