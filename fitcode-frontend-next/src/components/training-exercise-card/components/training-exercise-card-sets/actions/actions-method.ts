import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

export function getParamMinMax(
  param: Attribute,
  valueL: AttributeValue
): { min: number | undefined; max: number | undefined } {
  let min: number | undefined;
  let max: number | undefined;

  if (!param || !valueL) return { min, max };

  const foundInOptions = param.options?.find(
    (option) => option.field === valueL.selected
  );

  if (foundInOptions) {
    min = foundInOptions.min;
    max = foundInOptions.max;
  } else {
    min = param.min;
    max = param.max;
  }

  return { min, max };
}

export function combineMinMax(
  currentMin: number | undefined,
  currentMax: number | undefined,
  newMin: number | undefined,
  newMax: number | undefined
): { min: number | undefined; max: number | undefined } {
  let min = currentMin;
  let max = currentMax;

  if (newMin !== undefined)
    min = min !== undefined ? Math.max(min, newMin) : newMin;
  if (newMax !== undefined)
    max = max !== undefined ? Math.min(max, newMax) : newMax;

  return { min, max };
}
