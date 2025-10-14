import type { SetStateAction } from 'react';

import { updateSelectedExercisesExpandedSets } from './actions-expanded-sets';
import type { SetState } from '@/common/type/state.type';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import { updateTraining } from '@/components/training-exercise-card/actions/actions-training';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export function updateExerciseAttributeValues(
  input: {
    newValue: SetStateAction<string> | string;
    i: number;
    set: ExerciseSet;
    lOrR: 'L' | 'R';
    correctSelectedExercises: TrainingExercise[];
    correctExercise: TrainingExercise;
    correctParam: Attribute;
    correctSupersets: Superset[];
    correctSelectedSubgroup: Subgroup | null;
  },
  state: {
    training: Training;
    setTraining: SetState<Training | undefined>;
    component: TrainingComponent;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const {
    newValue,
    i,
    set,
    lOrR,
    correctSelectedExercises,
    correctExercise,
    correctParam,
    correctSupersets,
    correctSelectedSubgroup,
  } = input;

  const {
    training,
    setTraining,
    component,
    setSelectedSubgroup,
    setDetectedChanges,
  } = state;

  const exercisesToUpdate = correctSelectedExercises.some(
    (ex) => ex.id === correctExercise.id
  )
    ? correctSelectedExercises
    : [correctExercise];

  const updatedExercises = [] as TrainingExercise[];

  const baseParamField = correctParam.field.replace(/\d+/, '');
  const baseParamDefaultValue = correctExercise.exercise?.defaultParams?.find(
    (p) => p.field === correctParam.field
  )?.defaultValue;
  const baseSelected = correctExercise.sets[0].paramValuesL.find(
    (p) => p.field === correctParam.field
  )?.selected;

  if (!baseParamDefaultValue || !baseSelected) return;

  updateSelectedExercisesExpandedSets({
    updatedExercises,
    exercisesToUpdate,
    exercise: correctExercise,
    param: correctParam,
    set,
    i,
    lOrR,
    baseParamField,
    baseParamDefaultValue,
    baseSelected,
    newValue,
  });

  // if it's not a custom workload subgroup, find all custom workload subgroups and update them to the same value
  if (!correctSelectedSubgroup?.parentId) {
    CustomWorkloadsSubgroupsService.updateExerciseAttributeValues(
      {
        component,
        exercise: correctExercise,
        selectedSubgroup: correctSelectedSubgroup,
        exercisesToUpdate,
        param: correctParam,
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
      supersets: correctSupersets,
      setDetectedChanges,
      selectedSubgroup: correctSelectedSubgroup,
      setSelectedSubgroup,
    }
  );

  if (!correctSelectedSubgroup?.parentId) {
    // if it's not a custom workload subgroup, find all custom workload subgroups and update them to the same value
    const customSubgroups = component.subgroups.filter(
      (sg) => sg.parentId === correctSelectedSubgroup?.id || DEFAULT_SUBGROUP_ID
    );

    for (const subgroup of customSubgroups) {
      const subgroupExercises = subgroup.supersets.flatMap((s) => s.exercises);

      const subgroupExercisesToUpdate = subgroupExercises.filter((ex) =>
        exercisesToUpdate.some((e) => e.id === ex.id)
      );

      const subgroupExercise = subgroupExercises.find(
        (ex) => ex.id === correctExercise.id
      );

      const subgroupSet = subgroupExercise?.sets.find(
        (s) => s.setNumber === set.setNumber
      );

      if (!subgroupExercise || !subgroupSet) continue;

      updateSelectedExercisesExpandedSets({
        exercisesToUpdate: subgroupExercisesToUpdate,
        exercise: subgroupExercise,
        param: correctParam,
        set: subgroupSet,
        i,
        lOrR,
        baseParamField,
        baseParamDefaultValue,
        baseSelected,
        newValue,
      });
    }

    updateTraining(
      {
        exercises: updatedExercises,
      },
      {
        training,
        component,
        setTraining,
        supersets: correctSupersets,
        setDetectedChanges,
        selectedSubgroup: correctSelectedSubgroup,
        setSelectedSubgroup,
      }
    );
  }
}
