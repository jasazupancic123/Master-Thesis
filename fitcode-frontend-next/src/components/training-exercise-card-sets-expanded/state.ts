import type { SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import { updateTraining } from '../training-exercise-card/state';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import { TrainingService } from '@/controller/training/training.service';
import type { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { PrescribedWorkload } from '@/controller/training/type/workload-value.type';

export function updateExpandedSelectedAthleteValues(
  input: {
    exercise: TrainingExercise;
    param: Attribute;
    set: ExerciseSet;
    lOrR: string;
    newValue: SetStateAction<string>;
  },
  state: {
    training: Training;
    component: TrainingComponent;
    supersets: Superset[];
    selectedExercises: TrainingExercise[];
    selectedAthlete: { uid: string };
    selectedAthleteWorkloads: CompletedFutureWorkloads;
    setCustomAthleteWorkloads: (value: SetStateAction<Workload[]>) => void;
  }
) {
  const { exercise, param, set, lOrR, newValue } = input;
  const {
    training,
    component,
    supersets,
    selectedExercises,
    selectedAthlete,
    selectedAthleteWorkloads,
    setCustomAthleteWorkloads,
  } = state;

  const exercisesToUpdate = selectedExercises.some(
    (ex) => ex.id === exercise.id
  )
    ? selectedExercises
    : [exercise];

  const baseParamField = param.field.replace(/\d+/, '');
  const baseParamDefaultValue = exercise.exercise?.defaultParams?.find(
    (p) => p.field === param.field
  )?.defaultValue;
  const baseSelected = exercise.sets[0].paramValuesL.find(
    (p) => p.field === param.field
  )?.selected;

  if (!baseParamDefaultValue || !baseSelected) return;

  for (const exerciseToUpdate of exercisesToUpdate) {
    const exerciseSupersetIndex = supersets.findIndex((s) =>
      s.exercises.some((ex) => ex.id === exerciseToUpdate.id)
    );

    if (exerciseSupersetIndex === -1) {
      toast.error(
        `Superset for exercise ${exerciseToUpdate.exercise?.name || 'Unknown Exercise'} not found`
      );
      return;
    }

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

      const existingWorkload = selectedAthleteWorkloads.futureWorkloads.find(
        (w) =>
          w.componentId === component.id &&
          w.exerciseId === exerciseToUpdate.id &&
          w.setNumber === set.setNumber &&
          w.userId === selectedAthlete.uid
      );

      const newCustomWorkload =
        existingWorkload ||
        TrainingService.getPrescribedWorkload(
          exerciseToUpdate,
          set,
          !exercise.exercise?.isBilateral &&
            exerciseToUpdate.exercise?.isBilateral
        );

      const fieldNames =
        !exercise.exercise?.isBilateral &&
        exerciseToUpdate.exercise?.isBilateral
          ? [
              TrainingService.getPerscribedFieldName(possibleParam, 'L'),
              TrainingService.getPerscribedFieldName(possibleParam, 'R'),
            ]
          : [
              TrainingService.getPerscribedFieldName(
                possibleParam,
                lOrR as 'L' | 'R'
              ),
            ];

      // edit the field that was changed
      for (const fieldName of fieldNames) {
        newCustomWorkload[fieldName] = +newValue as unknown as undefined;
      }

      // add the new workload to the custom athlete workloads
      setCustomAthleteWorkloads((prev) => {
        const existingIndex = prev.findIndex(
          (w) =>
            w.componentId === component.id &&
            w.exerciseId === exerciseToUpdate.id &&
            w.setNumber === set.setNumber &&
            w.userId === selectedAthlete.uid
        );

        if (existingIndex !== -1) {
          const newWorkloads = [...prev];

          const parsed = newValue === '' ? undefined : Number(newValue);
          const value: number | undefined =
            parsed === undefined || Number.isNaN(parsed) ? undefined : parsed;

          const patch = Object.fromEntries(
            fieldNames.map((k) => [k, value])
          ) as Partial<Pick<PrescribedWorkload, (typeof fieldNames)[number]>>;

          newWorkloads[existingIndex] = {
            ...newWorkloads[existingIndex],
            supersetIndex: exerciseSupersetIndex,
            ...patch,
          };

          return newWorkloads;
        }

        // if not found, add a new workload
        return [
          ...prev,
          {
            ...newCustomWorkload,
            id: v4(),
            componentId: component.id,
            exerciseId: exerciseToUpdate.id,
            supersetIndex: exerciseSupersetIndex,
            setNumber: set.setNumber,
            userId: selectedAthlete.uid,
            institutionId: undefined,
            groupId: undefined,
            cycleId: undefined,
            trainingId: training.id,
            status: SetStatus.NOT_STARTED,
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            plannedAt: component.from,
            deletedAt: undefined,
          },
        ];
      });
    }
  }
}

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

  const exercisesToUpdate = selectedExercises.some(
    (ex) => ex.id === exercise.id
  )
    ? selectedExercises
    : [exercise];

  const updatedExericises = [] as TrainingExercise[];

  const baseParamField = param.field.replace(/\d+/, '');
  const baseParamDefaultValue = exercise.exercise?.defaultParams?.find(
    (p) => p.field === param.field
  )?.defaultValue;
  const baseSelected = exercise.sets[0].paramValuesL.find(
    (p) => p.field === param.field
  )?.selected;

  if (!baseParamDefaultValue || !baseSelected) return;

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

        return exercise.exercise?.isBilateral
          ? exerciseToUpdate.exercise?.isBilateral
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
          : exerciseToUpdate.exercise?.isBilateral
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
      updatedExericises.push(exerciseToUpdate);
    }
  }

  updateTraining(
    {
      exercises: updatedExericises,
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
