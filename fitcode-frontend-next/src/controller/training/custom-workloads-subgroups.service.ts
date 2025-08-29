import type { SetStateAction } from 'react';
import type { DraggableLocation } from 'react-beautiful-dnd';

import type { Attribute } from '../attribute/type/attribute.type';
import type { Exercise } from '../exercise/type/exercise.type';
import type { MainSet } from './enum/main-set.enum';
import type { ExerciseSet } from './type/exercise-set.type';
import type { Subgroup } from './type/subgroup.type';
import type { TrainingComponent } from './type/training-component.type';
import type { TrainingExercise } from './type/training-exercise.type';
import { removeExerciseFromSuperset } from '@/components/superset-exercise/state';
import { updateSupersets } from '@/components/supersets/state';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-day-view/constant';
import {
  onAddExerciseDrop,
  onDragEndExerciseToExistingSuperset,
} from '@/components/trainer-day-view/state';
import { removeSelectedExercisesFromSupersets } from '@/components/trainer-group-day-view/state';
import { onMainSetChange } from '@/components/training-component-header-menu/state';
import {
  updateSelectedExercisesVolWorkSets,
  updateSingleExerciseVolWorkSets as updateSingleExerciseVolWorkSetsTrainingExerciseCard,
} from '@/components/training-exercise-card/state';
import { updateSelectedExercisesCollapsedSets } from '@/components/training-exercise-card-sets-collapsed/state';
import { updateSelectedExercisesExpandedSets } from '@/components/training-exercise-card-sets-expanded/state';

export class CustomWorkloadsSubgroupsService {
  // when exercise is dropped on 'Add/drop exercise' area
  static updateOnAddExerciseDrop = (
    selectedSubgroup: Subgroup | null,
    component: TrainingComponent,
    draggableId: string
  ): Subgroup[] => {
    const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

    component.subgroups = component.subgroups.map((sg) => {
      if (sg.parentId === parentId) {
        return {
          ...sg,
          supersets:
            onAddExerciseDrop(sg.supersets, draggableId) || sg.supersets,
        };
      }

      return sg;
    });
    return component.subgroups;
  };

  // adds the exercises to custom workload subgroups, which have parentId of current subgroup
  // or the main group
  static addExercises = (
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null,
    exercisesToAdd: TrainingExercise[]
  ): Subgroup[] => {
    const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

    component.subgroups = component.subgroups.map((sg) => {
      if (sg.parentId === parentId) {
        const newSupersets = updateSupersets(
          sg.supersets,
          exercisesToAdd,
          sg.mainSet
        );

        return { ...sg, supersets: newSupersets || sg.supersets };
      }
      return sg;
    });

    return component.subgroups;
  };

  static updateOnDragEndExerciseToExistingSuperset = (
    draggableId: string,
    destination: DraggableLocation,
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null
  ): Subgroup[] => {
    const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

    component.subgroups = component.subgroups.map((sg) => {
      if (sg.parentId === parentId) {
        const newSupersets = onDragEndExerciseToExistingSuperset(
          { draggableId, destination },
          {
            component,
            selectedSubgroup,
            supersets: sg.supersets,
          }
        );

        return { ...sg, supersets: newSupersets || sg.supersets };
      }
      return sg;
    });

    return component.subgroups;
  };

  static updateMainSet = (
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null,
    mainSet: MainSet
  ): Subgroup[] => {
    const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

    component.subgroups = component.subgroups.map((sg) => {
      if (sg.parentId === parentId) {
        const newSupersets = onMainSetChange(component, sg, mainSet);

        return { ...sg, supersets: newSupersets, mainSet };
      }

      return sg;
    });

    return component.subgroups;
  };

  static updateSelectedExercisesVolWorkSets = (
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null,
    selectedExercises: TrainingExercise[],
    setsNumbers: { exerciseId: string; setsNumber: number }[],
    exercises: Exercise[]
  ) => {
    const customSubgroups = component.subgroups.filter(
      (sg) => sg.parentId === selectedSubgroup?.id || DEFAULT_SUBGROUP_ID
    );

    for (const subgroup of customSubgroups) {
      const subgroupExercises = subgroup.supersets.flatMap((s) => s.exercises);

      const subgroupSelectedExercises = subgroupExercises.filter((ex) =>
        selectedExercises.some((e) => e.id === ex.id)
      );

      updateSelectedExercisesVolWorkSets({
        selectedExercises: subgroupSelectedExercises,
        setsNumbers,
        exercises,
      });
    }
  };

  static updateSingleExerciseVolWorkSets = (
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null,
    exercise: TrainingExercise,
    setsNumbers: { exerciseId: string; setsNumber: number }[],
    foundExercise: Exercise
  ) => {
    const customSubgroups = component.subgroups.filter(
      (sg) => sg.parentId === selectedSubgroup?.id || DEFAULT_SUBGROUP_ID
    );

    for (const subgroup of customSubgroups) {
      const subgroupExercises = subgroup.supersets.flatMap((s) => s.exercises);

      const subgroupExercise = subgroupExercises.find(
        (ex) => ex.id === exercise.id
      );

      if (!subgroupExercise) continue;

      updateSingleExerciseVolWorkSetsTrainingExerciseCard({
        exercise: subgroupExercise,
        setsNumbers,
        foundExercise,
      });
    }
  };

  static updateSelectedExercisesCollapsedSets = (
    input: {
      component: TrainingComponent;
      exercise: TrainingExercise;
      selectedSubgroup: Subgroup | null;
      exercisesToUpdate: TrainingExercise[];
      param: Attribute;
    },
    state: {
      lOrR: string;
      baseParamField: string;
      baseParamDefaultValue: string;
      baseSelected: string;
      newValue: SetStateAction<string>;
    }
  ) => {
    const { component, exercise, selectedSubgroup, exercisesToUpdate, param } =
      input;
    const {
      lOrR,
      baseParamField,
      baseParamDefaultValue,
      baseSelected,
      newValue,
    } = state;

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

      if (!subgroupExercise) continue;

      updateSelectedExercisesCollapsedSets(
        {
          exercisesToUpdate: subgroupExercisesToUpdate,
          exercise: subgroupExercise,
          param,
        },
        {
          lOrR,
          baseParamField,
          baseParamDefaultValue,
          baseSelected,
          newValue,
        }
      );
    }
  };

  static updateExerciseAttributeValues = (
    input: {
      component: TrainingComponent;
      exercise: TrainingExercise;
      selectedSubgroup: Subgroup | null;
      exercisesToUpdate: TrainingExercise[];
      param: Attribute;
      set: ExerciseSet;
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
    const {
      component,
      exercise,
      selectedSubgroup,
      exercisesToUpdate,
      param,
      set,
    } = input;

    const {
      i,
      lOrR,
      baseParamField,
      baseParamDefaultValue,
      baseSelected,
      newValue,
    } = state;

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
  };

  static removeExerciseFromSuperset = (
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null,
    supersetIndex: number,
    exerciseIndex: number
  ): Subgroup[] => {
    const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

    component.subgroups = component.subgroups.map((sg) => {
      if (sg.parentId === parentId) {
        const newSupersets = removeExerciseFromSuperset(
          sg.supersets,
          supersetIndex,
          exerciseIndex
        );

        return { ...sg, supersets: newSupersets };
      }
      return sg;
    });

    return component.subgroups;
  };

  static removeSelectedExercises = (
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null,
    selectedExercises: TrainingExercise[]
  ) => {
    const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

    component.subgroups = component.subgroups.map((sg) => {
      if (sg.parentId === parentId) {
        const newSupersets = removeSelectedExercisesFromSupersets(
          sg.supersets,
          selectedExercises
        );

        return { ...sg, supersets: newSupersets };
      }
      return sg;
    });

    return component.subgroups;
  };
}
