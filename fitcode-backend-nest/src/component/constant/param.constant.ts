import { AttributeType } from '../../common/enum/attribute-type.enum';
import { Attribute } from '../../attribute/entity/attribute.entity';
import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '../enum/param.enum';

const VOL_WORK_SET_OPTIONS: Attribute[] = [
  {
    field: VolWorkSetType.Set,
    name: 'Set',
    type: AttributeType.Number,
  },
];

const VOL_OPTIONS: Attribute[] = [
  {
    field: VolType.Rep,
    name: 'Rep',
    type: AttributeType.Number,
  },
  {
    field: VolType.Time,
    name: 'Time',
    type: AttributeType.Number,
  },
  {
    field: VolType.Dist,
    name: 'Dist',
    type: AttributeType.Number,
  },
];

const INT_OPTIONS: Attribute[] = [
  {
    field: IntType.Kg,
    name: 'KG',
    unit: 'kg',
    type: AttributeType.Number,
  },
  {
    field: IntType.Bw,
    name: 'BW',
    unit: '%',
    type: AttributeType.Number,
  },
  {
    field: IntType.Rm,
    name: 'RM',
    type: AttributeType.Number,
  },
  {
    field: IntType.Mas,
    name: 'MAS',
    unit: '%',
    type: AttributeType.Number,
  },
  {
    field: IntType.Hrmax,
    name: 'HRMax',
    unit: '%',
    type: AttributeType.Number,
  },
  {
    field: IntType.Tempo,
    name: 'Tempo',
    type: AttributeType.Select,
    options: [
      { field: 'a', name: '0:0:0', type: AttributeType.Value },
      { field: 'b', name: '1:0:1', type: AttributeType.Value },
      { field: 'c', name: '2:0:1', type: AttributeType.Value },
      { field: 'd', name: '3:0:1', type: AttributeType.Value },
    ],
  },
  {
    field: IntType.Eff,
    name: 'Eff',
    type: AttributeType.Select,
    options: [
      { field: 'easy', name: 'Easy', type: AttributeType.Value },
      { field: 'mod', name: 'Mod', type: AttributeType.Value },
      { field: 'hard', name: 'Hard', type: AttributeType.Value },
      { field: 'max', name: 'Max', type: AttributeType.Value },
    ],
  },
];

export const PARAMS: Attribute[] = [
  {
    field: ParamType.VolWorkSets,
    name: 'Set',
    type: AttributeType.Select,
    options: VOL_WORK_SET_OPTIONS,
  },
  {
    field: ParamType.VolWork1,
    name: 'VO2',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
  },
  {
    field: ParamType.VolWork2,
    name: 'VO2',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
  },
  {
    field: ParamType.IntWork1,
    name: 'INT',
    type: AttributeType.Select,
    options: INT_OPTIONS,
  },
  {
    field: ParamType.IntWork2,
    name: 'INT',
    type: AttributeType.Select,
    options: INT_OPTIONS,
  },
  {
    field: ParamType.VolRec1,
    name: 'Rec',
    type: AttributeType.Select,
    options: VOL_OPTIONS,
  },
  {
    field: ParamType.IntRec1,
    name: 'Rec',
    type: AttributeType.Select,
    options: INT_OPTIONS,
  },
];
