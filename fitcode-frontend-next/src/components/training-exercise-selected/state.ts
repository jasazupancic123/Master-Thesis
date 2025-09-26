import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import {
  IntType,
  type ParamType,
} from '@/controller/component/enum/param.enum';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export function isNumber(
  exercise: TrainingExercise,
  paramField: ParamType,
  paramValues: AttributeValue[] // pass exercise.sets[0].paramValuesL
): boolean {
  const foundParam = exercise.params.find((p) => p.field === paramField);
  const paramValue = paramValues.find((pv) => pv.field === paramField);

  if (!foundParam || !paramValue) return false;

  if (paramValue.selected === IntType.Tempo) return false;

  const selected = foundParam.options?.find(
    (o) => o.field === paramValue.selected
  );
  if (!selected || selected.type !== 'number') return false;

  return true;
}
