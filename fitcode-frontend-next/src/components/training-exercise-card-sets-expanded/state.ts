import type { SetStateAction } from 'react';

import { updateTraining } from '../training-exercise-card/state';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { TrainingService } from '@/controller/training/training.service';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { IntensityVolumeValues } from '@/controller/training/type/intensity-volume-values.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export function updateExerciseAttributeValues(
  input: {
    newValue: SetStateAction<string>;
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
  // update only the changed exercise
  if (
    !selectedExercises.length ||
    !selectedExercises.some((ex) => ex.id === exercise.id)
  ) {
    const paramIndex = (
      lOrR === 'L'
        ? exercise.sets[i].paramValuesL
        : exercise.sets[i].paramValuesR || []
    ).findIndex((pv) => pv.field === param.field);
    const newExercise = { ...exercise };

    const setIndex = newExercise.sets.findIndex(
      (s) => s.setNumber === set.setNumber
    );

    const updatedSets: ExerciseSet[] = newExercise.sets.map((set, k) => {
      return lOrR === 'L'
        ? {
            setNumber: set.setNumber,
            paramValuesR: set.paramValuesR,
            paramValuesL: [...set.paramValuesL].map(
              (param, index) =>
                ({
                  field: param.field,
                  selected: param.selected,
                  value:
                    index === paramIndex && setIndex === k
                      ? (newValue as string)
                      : param.value,
                }) as AttributeValue
            ),
          }
        : {
            setNumber: set.setNumber,
            paramValuesR: set.paramValuesR
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
              : undefined,
            paramValuesL: set.paramValuesL,
          };
    });

    const intensityVolumeValue = TrainingService.getAverageIntVol(updatedSets);

    newExercise.sets = [...updatedSets];
    updateTraining(
      {
        exercises: [newExercise],
        intensityVolumeValues: [intensityVolumeValue],
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
  // update all selected exercises
  else {
    const updatedExericises = [] as TrainingExercise[];
    const intensityVolumeValues = [] as IntensityVolumeValues[];

    for (const selectedExercise of selectedExercises) {
      if (selectedExercise.sets.length < i + 1) continue;

      const setIndex = selectedExercise.sets.findIndex(
        (s) => s.setNumber === set.setNumber
      );

      if (setIndex === undefined) continue;

      const paramIndex = (
        lOrR === 'L'
          ? selectedExercise.sets[setIndex].paramValuesL
          : selectedExercise.sets[setIndex].paramValuesR || []
      ).findIndex((pv) => pv.field === param.field);

      if (paramIndex === undefined) continue;

      const updatedSets: ExerciseSet[] = selectedExercise.sets.map((set, k) => {
        return lOrR === 'L'
          ? {
              setNumber: set.setNumber,
              paramValuesR: set.paramValuesR,
              paramValuesL: [...set.paramValuesL].map(
                (param, index) =>
                  ({
                    field: param.field,
                    selected: param.selected,
                    value:
                      index === paramIndex && setIndex === k
                        ? (newValue as string)
                        : param.value,
                  }) as AttributeValue
              ),
            }
          : {
              setNumber: set.setNumber,
              paramValuesR: set.paramValuesR
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
                : undefined,
              paramValuesL: set.paramValuesL,
            };
      });

      const intensityVolumeValue =
        TrainingService.getAverageIntVol(updatedSets);

      selectedExercise.sets = [...updatedSets];
      updatedExericises.push(selectedExercise);
      intensityVolumeValues.push(intensityVolumeValue);
    }
    updateTraining(
      {
        exercises: updatedExericises,
        intensityVolumeValues,
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
