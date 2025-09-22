import type { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { generateRandomNumber } from '@src/common/utils/random.util';
import { PARAMS } from '@src/component/constant/param.constant';
import type { ComponentParam } from '@src/component/entity/component-param.entity';
import { ParamType } from '@src/component/enum/param.enum';
import {
  IntType,
  VolType,
  VolWorkSetType,
} from '@src/component/enum/param.enum';

import type {
  ParamToSelectedMap,
  ValidParams,
} from '../interface/param-to-selected.interface';
import { parseDefaultValueOrFirstOption } from './workload.stub';

/**
 * Generates an array of AttributeValues based on the provided ComponentParams.
 * Based on the provided componentParam, like VolWorkSets, IntWork1, etc., it
 * selects default values (because every root param is of select type) and generates
 * AttributeValues for each param with correct selected options and values, which
 * are either random or default.
 *
 * @param componentParams - array of ComponentParam objects to generate AttributeValues from
 * @param random - if true, generate random values for params, else use defaults
 */
export function generateParamAttributeValuesFromComponentParams(
  componentParams: ComponentParam[],
  random = false,
): AttributeValue[] {
  return componentParams
    .filter((p) => p.field !== ParamType.VolWorkSets) // special case, skip it
    .map((componentParam) => {
      const param = PARAMS.find((p) => p.field === componentParam.field); // root param, for example: VolWorkSets, IntWork1
      const selected = // root param is always of select type, for example: VolWorkSets -> Set, IntWork1 -> Kg
        parseDefaultValueOrFirstOption<ParamToSelectedMap[ParamType]>(
          componentParam,
        );

      const option = param.options?.find((o) => o.field === selected);

      if (random)
        return generateParamAttributeValue({
          field: param.field as ParamType,
          selected: option.field as ParamToSelectedMap[ParamType],
        });

      // edge case for effort and tempo for intensity params: IntWork1 -> Effort -> 0
      return {
        field: param.field, // for example: VolWorkSets, IntWork1
        selected: option.field, // for example: Set, Kg
        value: parseDefaultValueOrFirstOption<string>(option) || '',
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
  if (!value) value = generateRandomParamFieldValue(selected);
  return { field: field, selected, value: value.toString() };
}

export function generateRandomParamFieldValue(selected: string): number {
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
      return generateRandomNumber(1, 4); // effort level
    case IntType.Tempo:
      return generateRandomNumber(1000, 9999); // tempo level
  }
}
