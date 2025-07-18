import { ParamType } from '@src/component/enum/param.enum';
import { generateComponentParamsStub } from '@src/component/mock/component-param.stub';

export const COMPONENT_PARAMS_OPT1 = generateComponentParamsStub([
  ParamType.VolWorkSets, // sets
  ParamType.VolWork1, // reps
  ParamType.IntWork1, // kg
]);

export const COMPONENT_PARAMS_OPT2 = generateComponentParamsStub([
  ParamType.VolWorkSets, // sets
  ParamType.VolWork2, // dist
  ParamType.IntWork2, // tempo
  ParamType.IntRec1, // eff
]);
