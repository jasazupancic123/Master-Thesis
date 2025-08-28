import type { DraggableLocation } from 'react-beautiful-dnd';

import type { MainSet } from './enum/main-set.enum';
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
