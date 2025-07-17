import { generateRandomNumber } from '@test/common/utils/random.util';

import type { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { PARAMS } from '@src/component/constant/param.constant';
import type { ComponentParam } from '@src/component/entity/component-param.entity';
import type { ParamType } from '@src/component/enum/param.enum';
import {
  IntType,
  VolType,
  VolWorkSetType,
} from '@src/component/enum/param.enum';

import type {
  ParamToSelectedMap,
  ValidParams,
} from '../interface/param-to-selected.interface';

/**
 * @param componentParams - array of ComponentParam objects to generate AttributeValues from
 * @param random - if true, generate random values for params, else use defaults
 */
export function generateParamAttributeValuesFromComponentParams(
  componentParams: ComponentParam[],
  random = false,
): AttributeValue[] {
  return componentParams.map((componentParam) => {
    // root param, for example: VolWorkSets, IntWork1
    const param = PARAMS.find((p) => p.field === componentParam.field);
    if (!param)
      throw new Error(`Param with field ${componentParam.field} not found`);

    // root param is always of select type, for example: VolWorkSets -> Set, IntWork1 -> Kg
    const selected = param.defaultValue || param.options?.[0]?.field || null;
    if (!selected) throw new Error(`No selection for param ${param.field}`);

    const option = param.options?.find((o) => o.field === selected);
    if (!option)
      throw new Error(
        `Option with field ${selected} not found in param ${param.field}`,
      );

    if (random)
      return generateParamAttributeValue({
        field: param.field as ParamType,
        selected: option.field as ParamToSelectedMap[ParamType],
      });

    // edge case for effort and tempo for intensity params: IntWork1 -> Effort -> 0
    const suboption = option.options?.[0]?.field;
    return {
      field: param.field, // for example: VolWorkSets, IntWork1
      selected: `${option.field}${suboption ? `:${suboption}` : ''}`,
      value: option.defaultValue || option.options?.[0]?.defaultValue || '',
    };
  });
}

export function generateParamAttributeValue({
  field, // root param (VolWorkSets, IntWork1), always of select type
  selected, // selected option (Set, Kg, Effort, etc.)
  value, // if not provided, generate random value
}:
  | ValidParams
  | {
      field: ParamType;
      selected: VolType | IntType | VolWorkSetType;
      value?: number;
    }): AttributeValue {
  if (!value) value = generatRandomParamFieldValue(selected);

  return {
    field: field,
    selected: [IntType.Eff, IntType.Tempo].includes(selected as IntType)
      ? `${selected}:${value}`
      : selected,
    value: value.toString(),
  };
}

export function generatRandomParamFieldValue(selected: string): number {
  switch (selected) {
    case VolWorkSetType.Set:
      return generateRandomNumber(3, 6);
    case VolType.Rep:
      return generateRandomNumber(3, 20);
    case VolType.Time:
      return generateRandomNumber(30, 120); // in seconds
    case VolType.Dist:
      return generateRandomNumber(100, 1000); // in meters
    case IntType.Kg:
      return generateRandomNumber(20, 120); // in kg
    case IntType.Bw:
    case IntType.Rm:
    case IntType.Mas:
    case IntType.Hrmax:
      return generateRandomNumber(50, 100); // in percentage
    case IntType.Eff:
      return generateRandomNumber(0, 3); // effort level
    case IntType.Tempo:
      return generateRandomNumber(0, 3); // tempo level
  }
}
