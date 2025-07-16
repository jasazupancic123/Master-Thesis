import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '../../component/enum/param.enum';

export type ParamToSelectedMap = {
  [ParamType.VolWorkSets]: VolWorkSetType;
  [ParamType.VolWork1]: VolType;
  [ParamType.VolWork2]: VolType;
  [ParamType.VolRec1]: VolType;
  [ParamType.IntWork1]: IntType;
  [ParamType.IntWork2]: IntType;
  [ParamType.IntRec1]: IntType;
};

type ParamSelectedValue<T extends ParamType> = {
  field: T;
  selected: ParamToSelectedMap[T];
  value?: number;
};

export type ValidParams = {
  [K in keyof ParamToSelectedMap]: ParamSelectedValue<K & ParamType>;
}[keyof ParamToSelectedMap];
