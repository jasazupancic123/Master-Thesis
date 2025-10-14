import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export const getLAndRValues = (input: {
  set: ExerciseSet;
  param: Attribute;
  setIndex: number;
  paramIndex: number;
  exercise: TrainingExercise;
}): {
  valueL: AttributeValue | null;
  valueR: AttributeValue | null;
} => {
  const { exercise, param, setIndex } = input;

  const valueL: AttributeValue | null = exercise.sets[
    setIndex
  ].paramValuesL.find((pv) => pv.field === param.field) || {
    field: param.field,
    selected: 'set',
    value: exercise.sets.length.toString(),
  };
  const valueR: AttributeValue | null = exercise.sets[
    setIndex
  ].paramValuesR?.find((pv) => pv.field === param.field) || {
    field: param.field,
    selected: 'set',
    value: exercise.sets.length.toString(),
  };

  return { valueL, valueR };
};
