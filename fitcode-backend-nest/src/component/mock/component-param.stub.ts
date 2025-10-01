import { PARAMS } from '@src/training/constant/param.constant';

import type { ComponentParam } from '../entity/component-param.entity';

/**
 * Generates a mock ComponentParam object based on the provided field.
 * It finds the corresponding parameter from the PARAMS constant and
 * returns a ComponentParam object with the field, defaultValue and
 * all of the options of the parameter.
 */
export function generateComponentParamStub(field: string): ComponentParam {
  const param = PARAMS.find((p) => p.field === field);
  if (!param)
    throw new Error(`Component parameter with field ${field} not found`);

  return {
    field: param.field,
    defaultValue: param.defaultValue,
  };
}

export function generateComponentParamsStub(
  fields: string[] = PARAMS.map((p) => p.field),
): ComponentParam[] {
  return fields.map((field) => generateComponentParamStub(field));
}
