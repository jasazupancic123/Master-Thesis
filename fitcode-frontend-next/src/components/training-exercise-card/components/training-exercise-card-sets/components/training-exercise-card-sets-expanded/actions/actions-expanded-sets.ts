import type { SetStateAction } from 'react';

import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export const updateSelectedExercisesExpandedSets = (input: {
  updatedExercises?: TrainingExercise[];
  exercisesToUpdate: TrainingExercise[];
  set: ExerciseSet;
  exercise: TrainingExercise;
  param: Attribute;
  i: number;
  lOrR: 'L' | 'R';
  baseParamField: string;
  baseParamDefaultValue: string;
  baseSelected: string;
  newValue: SetStateAction<string>;
}) => {
  const {
    updatedExercises,
    exercisesToUpdate,
    exercise,
    param,
    set,
    i,
    lOrR,
    baseParamField,
    baseParamDefaultValue,
    baseSelected,
    newValue,
  } = input;

  for (const exerciseToUpdate of exercisesToUpdate) {
    if (exerciseToUpdate.sets.length < i + 1) continue;

    const setIndex = exerciseToUpdate.sets.findIndex(
      (s) => s.setNumber === set.setNumber
    );

    if (setIndex === -1) continue;

    const possibleParams = (
      lOrR === 'L'
        ? exerciseToUpdate.sets[0].paramValuesL
        : exerciseToUpdate.sets[0].paramValuesR || []
    ).filter((p) => p.field.startsWith(baseParamField));

    for (const possibleParam of possibleParams) {
      if (
        exerciseToUpdate.id === exercise.id &&
        possibleParam.field !== param.field
      )
        continue;

      const paramDefaultValue = exerciseToUpdate.exercise?.defaultParams?.find(
        (p) => p.field === possibleParam.field
      )?.defaultValue;
      const paramSelected = exerciseToUpdate.sets[0].paramValuesL.find(
        (p) => p.field === possibleParam.field
      )?.selected;

      if (
        baseParamDefaultValue !== paramDefaultValue ||
        baseSelected !== paramSelected
      )
        continue;

      const paramIndex = (
        lOrR === 'L'
          ? exerciseToUpdate.sets[0].paramValuesL
          : exerciseToUpdate.sets[0].paramValuesR || []
      ).findIndex((pv) => pv.field === possibleParam.field);

      if (paramIndex === -1) continue;

      const updatedSets: ExerciseSet[] = exerciseToUpdate.sets.map((set, k) => {
        const updatedParamValuesL = [...set.paramValuesL].map(
          (param, index) =>
            ({
              field: param.field,
              selected: param.selected,
              value:
                index === paramIndex && setIndex === k
                  ? (newValue as string)
                  : param.value,
            }) as AttributeValue
        );
        const updatedParamValuesR = set.paramValuesR
          ? [...set.paramValuesR].map(
              (param, index) =>
                ({
                  field: param.field,
                  selected: param.selected,
                  value:
                    index === paramIndex && setIndex === k
                      ? (newValue as string)
                      : param.value,
                }) as AttributeValue
            )
          : undefined;

        return exercise.exercise?.isUnilateral
          ? exerciseToUpdate.exercise?.isUnilateral
            ? lOrR === 'L'
              ? {
                  setNumber: set.setNumber,
                  paramValuesL: updatedParamValuesL,
                  paramValuesR: set.paramValuesR,
                }
              : {
                  setNumber: set.setNumber,
                  paramValuesL: set.paramValuesL,
                  paramValuesR: updatedParamValuesR,
                }
            : {
                setNumber: set.setNumber,
                paramValuesL: updatedParamValuesL,
                paramValuesR: set.paramValuesR,
              }
          : exerciseToUpdate.exercise?.isUnilateral
            ? {
                setNumber: set.setNumber,
                paramValuesL: updatedParamValuesL,
                paramValuesR: updatedParamValuesR,
              }
            : {
                setNumber: set.setNumber,
                paramValuesL: updatedParamValuesL,
                paramValuesR: set.paramValuesR,
              };
      });

      exerciseToUpdate.sets = [...updatedSets];
      if (updatedExercises) updatedExercises.push(exerciseToUpdate);
    }
  }
};
