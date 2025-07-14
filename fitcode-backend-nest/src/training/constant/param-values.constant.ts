import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '../../component/enum/param.enum';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';

export const ALL_PARAM_VALUES: AttributeValue[] = [
  {
    field: ParamType.VolWorkSets,
    selected: VolWorkSetType.Set,
    value: '3',
  },
  {
    field: ParamType.VolWork1,
    selected: VolType.Rep,
    value: '12',
  },
  {
    field: ParamType.VolWork2,
    selected: VolType.Dist,
    value: '100',
  },
  {
    field: ParamType.IntWork1,
    selected: IntType.Kg,
    value: '60',
  },
  {
    field: ParamType.IntWork2,
    selected: `${IntType.Eff}:0`,
    value: '0',
  },
  {
    field: ParamType.VolRec1,
    selected: VolType.Time,
    value: '120',
  },
  {
    field: ParamType.IntRec1,
    selected: `${IntType.Tempo}:0`,
    value: '0',
  },
];

export const PARTIAL_PARAM_VALUES: AttributeValue[] = [
  ALL_PARAM_VALUES[0], // sets,
  ALL_PARAM_VALUES[1], // reps,
  ALL_PARAM_VALUES[3], // kgs,
];
