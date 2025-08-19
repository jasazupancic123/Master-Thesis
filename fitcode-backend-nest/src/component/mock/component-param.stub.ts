import { PARAMS } from '../constant/param.constant';
import type { ComponentParam } from '../entity/component-param.entity';
import type { ParamType } from '../enum/param.enum';

/**
 * Generates a mock ComponentParam object based on the provided field.
 * It finds the corresponding parameter from the PARAMS constant and
 * returns a ComponentParam object with the field, defaultValue and
 * all of the options of the parameter.
 */
export function generateComponentParamStub(field: ParamType): ComponentParam {
  const param = PARAMS.find((p) => p.field === field);
  if (!param)
    throw new Error(`Component parameter with field ${field} not found`);

  return {
    field: param.field,
    defaultValue: param.defaultValue,
  };
}

export function generateComponentParamsStub(
  fields: ParamType[] = PARAMS.map((p) => p.field as ParamType),
): ComponentParam[] {
  return fields.map((field) => generateComponentParamStub(field));
}
