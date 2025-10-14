import type { SetStateAction } from 'react';
import type { DraggableLocation } from 'react-beautiful-dnd';

import type { Attribute } from '../attribute/type/attribute.type';
import type { Exercise } from '../exercise/type/exercise.type';
import type { MainSet } from './enum/main-set.enum';
import type { ExerciseSet } from './type/exercise-set.type';
import type { Subgroup } from './type/subgroup.type';
import type { Superset } from './type/superset.type';
import type { TrainingComponent } from './type/training-component.type';
import type { TrainingExercise } from './type/training-exercise.type';
import {
  onAddExerciseDrop,
  onDragEndExerciseToExistingSuperset,
} from '@/components/supersets/actions/actions-drag-exercise';
import { updateSupersets } from '@/components/supersets/actions/actions-supersets';
import { removeExerciseFromSuperset } from '@/components/supersets/components/superset-exercise/state';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import { removeSelectedExercisesFromSupersets } from '@/components/training-component/training-component-card/actions/actions-selected-exercises';
import { onMainSetChange } from '@/components/training-component/training-component-header-menu/actions/actions-main-set';
import {
  updateSelectedExercisesCollapsedSets,
  updateSelectedExercisesVolWorkSets,
  updateSingleExerciseVolWorkSets,
} from '@/components/training-exercise-card/components/training-exercise-card-sets/components/training-exercise-card-sets-collapsed/actions/actions-attribute';
import { updateSelectedExercisesExpandedSets } from '@/components/training-exercise-card/components/training-exercise-card-sets/components/training-exercise-card-sets-expanded/actions/actions-expanded-sets';

export class CustomWorkloadsSubgroupsService {
  // when exercise is dropped on 'Add/drop exercise' area
  static updateOnAddExerciseDrop = (
    selectedSubgroup: Subgroup | null,
    component: TrainingComponent,
    draggableId: string
  ): Subgroup[] => {
    const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

    component.subgroups = component.subgroups.map((sg) => {
      if (sg.parentId && sg.parentId === parentId) {
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
      if (sg.parentId && sg.parentId === parentId) {
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
      if (sg.parentId && sg.parentId === parentId) {
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

  static updateMainSet = (input: {
    component: TrainingComponent;
    selectedSubgroup: Subgroup | null;
    mainSet: MainSet;
  }): Subgroup[] => {
    const { component, selectedSubgroup, mainSet } = input;

    const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

    component.subgroups = component.subgroups.map((sg) => {
      if (sg.parentId && sg.parentId === parentId) {
        const newSupersets = onMainSetChange({
          mainSet,
          updatedComponent: component,
          updatedSubgroup: selectedSubgroup,
        });

        return { ...sg, supersets: newSupersets, mainSet };
      }

      return sg;
    });

    return component.subgroups;
  };

  static updateExercisesAttributeTypes(
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null,
    supersets: Superset[],
    param: Attribute
  ) {
    const customSubgroups = component.subgroups.filter(
      (sg) => sg.parentId === (selectedSubgroup?.id || DEFAULT_SUBGROUP_ID)
    );

    customSubgroups.forEach((sg) => {
      sg.supersets.forEach((s, i) => {
        s.exercises.forEach((ex, j) => {
          ex.sets.forEach((set, k) => {
            const matchingSet = supersets[i]?.exercises[j]?.sets[k];
            if (!matchingSet) return;

            const oldParamValueL = set.paramValuesL.find(
              (pv) => pv.field === param.field
            );
            const newParamValueL = matchingSet.paramValuesL.find(
              (pv) => pv.field === param.field
            );
            if (!oldParamValueL || !newParamValueL) return;

            if (oldParamValueL.selected !== newParamValueL.selected) {
              oldParamValueL.selected = newParamValueL.selected;
              oldParamValueL.value = newParamValueL.value;
            }

            const oldParamValueR = set.paramValuesR?.find(
              (pv) => pv.field === param.field
            );
            const newParamValueR = matchingSet.paramValuesR?.find(
              (pv) => pv.field === param.field
            );
            if (!oldParamValueR || !newParamValueR) return;

            if (oldParamValueR.selected !== newParamValueR.selected) {
              oldParamValueR.selected = newParamValueR.selected;
              oldParamValueR.value = newParamValueR.value;
            }
          });
        });
      });
    });
  }

  static updateSelectedExercisesVolWorkSets = (
    component: TrainingComponent,
    selectedSubgroup: Subgroup | null,
    selectedExercises: TrainingExercise[],
    setsNumbers: { exerciseId: string; setsNumber: number }[],
    exercises: Exercise[]
  ) => {
    const customSubgroups = component.subgroups.filter(
      (sg) => sg.parentId === (selectedSubgroup?.id || DEFAULT_SUBGROUP_ID)
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
      (sg) => sg.parentId === (selectedSubgroup?.id || DEFAULT_SUBGROUP_ID)
    );

    for (const subgroup of customSubgroups) {
      const subgroupExercises = subgroup.supersets.flatMap((s) => s.exercises);

      const subgroupExercise = subgroupExercises.find(
        (ex) => ex.id === exercise.id
      );

      if (!subgroupExercise) continue;

      updateSingleExerciseVolWorkSets({
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
      (sg) => sg.parentId === (selectedSubgroup?.id || DEFAULT_SUBGROUP_ID)
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

      updateSelectedExercisesCollapsedSets({
        exercisesToUpdate: subgroupExercisesToUpdate,
        exercise: subgroupExercise,
        param,
        lOrR,
        baseParamField,
        baseParamDefaultValue,
        baseSelected,
        newValue,
      });
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
      (sg) => sg.parentId === (selectedSubgroup?.id || DEFAULT_SUBGROUP_ID)
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

      updateSelectedExercisesExpandedSets({
        exercisesToUpdate: subgroupExercisesToUpdate,
        exercise: subgroupExercise,
        param,
        set: subgroupSet,
        i,
        lOrR,
        baseParamField,
        baseParamDefaultValue,
        baseSelected,
        newValue,
      });
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
      if (sg.parentId && sg.parentId === parentId) {
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
      if (sg.parentId && sg.parentId === parentId) {
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
