import type { SetStateAction } from 'react';

import { DEFAULT_SUBGROUP_ID } from '../trainer-day-view/constant';
import { updateTraining } from '../training-exercise-card/state';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export const updateSelectedExercisesExpandedSets = (
  input: {
    updatedExercises?: TrainingExercise[];
    exercisesToUpdate: TrainingExercise[];
    set: ExerciseSet;
    exercise: TrainingExercise;
    param: Attribute;
  },
  state: {
    i: number;
    lOrR: 'L' | 'R';
    baseParamField: string;
    baseParamDefaultValue: string;
    baseSelected: string;
    newValue: SetStateAction<string>;
  }
) => {
  const { updatedExercises, exercisesToUpdate, exercise, param, set } = input;

  const {
    i,
    lOrR,
    baseParamField,
    baseParamDefaultValue,
    baseSelected,
    newValue,
  } = state;

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

export function updateExerciseAttributeValues(
  input: {
    newValue: SetStateAction<string> | string;
    i: number;
    set: ExerciseSet;
    lOrR: 'L' | 'R';
  },
  state: {
    selectedExercises: TrainingExercise[];
    exercise: TrainingExercise;
    param: Attribute;
    training: Training;
    component: TrainingComponent;
    setTraining: SetStateNullable<Training>;
    supersets: Superset[];
    setDetectedChanges: SetState<boolean>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
  }
) {
  const { newValue, i, set, lOrR } = input;
  const {
    selectedExercises,
    exercise,
    param,
    training,
    component,
    setTraining,
    supersets,
    setDetectedChanges,
    selectedSubgroup,
    setSelectedSubgroup,
  } = state;

  const exercisesToUpdate = selectedExercises.some(
    (ex) => ex.id === exercise.id
  )
    ? selectedExercises
    : [exercise];

  const updatedExercises = [] as TrainingExercise[];

  const baseParamField = param.field.replace(/\d+/, '');
  const baseParamDefaultValue = exercise.exercise?.defaultParams?.find(
    (p) => p.field === param.field
  )?.defaultValue;
  const baseSelected = exercise.sets[0].paramValuesL.find(
    (p) => p.field === param.field
  )?.selected;

  if (!baseParamDefaultValue || !baseSelected) return;

  updateSelectedExercisesExpandedSets(
    { updatedExercises, exercisesToUpdate, exercise, param, set },
    { i, lOrR, baseParamField, baseParamDefaultValue, baseSelected, newValue }
  );

  // if it's not a custom workload subgroup, find all custom workload subgroups and update them to the same value
  if (!selectedSubgroup?.parentId) {
    CustomWorkloadsSubgroupsService.updateExerciseAttributeValues(
      {
        component,
        exercise,
        selectedSubgroup,
        exercisesToUpdate,
        param,
        set,
      },
      {
        i,
        lOrR,
        baseParamField,
        baseParamDefaultValue,
        baseSelected,
        newValue,
      }
    );
  }

  updateTraining(
    {
      exercises: updatedExercises,
    },
    {
      training,
      component,
      setTraining,
      supersets,
      setDetectedChanges,
      selectedSubgroup,
      setSelectedSubgroup,
    }
  );

  if (!selectedSubgroup?.parentId) {
    // if it's not a custom workload subgroup, find all custom workload subgroups and update them to the same value
    const customSubgroups = component.subgroups.filter(
      (sg) => sg.parentId === selectedSubgroup?.id || DEFAULT_SUBGROUP_ID
    );

    for (const subgroup of customSubgroups) {
      const subgroupExercises = subgroup.supersets.flatMap((s) => s.exercises);

      const subgroupExercisesToUpdate = subgroupExercises.filter((ex) =>
        exercisesToUpdate.some((e) => e.id === ex.id)
      );

      const subgroupExercise = subgroupExercises.find(
        (ex) => ex.id === exercise.id
      );

      const subgroupSet = subgroupExercise?.sets.find(
        (s) => s.setNumber === set.setNumber
      );

      if (!subgroupExercise || !subgroupSet) continue;

      updateSelectedExercisesExpandedSets(
        {
          exercisesToUpdate: subgroupExercisesToUpdate,
          exercise: subgroupExercise,
          param,
          set: subgroupSet,
        },
        {
          i,
          lOrR,
          baseParamField,
          baseParamDefaultValue,
          baseSelected,
          newValue,
        }
      );
    }

    updateTraining(
      {
        exercises: updatedExercises,
      },
      {
        training,
        component,
        setTraining,
        supersets,
        setDetectedChanges,
        selectedSubgroup,
        setSelectedSubgroup,
      }
    );
  }
}
