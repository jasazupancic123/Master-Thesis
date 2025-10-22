import type { DraggableLocation } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import { NUM_MAX_SUPERSETS } from '@/components/trainer-group-day-view/constant/supersets.constant';
import { onMainSetChange } from '@/components/training-component/actions/actions-main-set';
import { removeSelectedExercisesFromSupersets } from '@/components/training-component/actions/actions-selected-exercises';
import { core } from '@/core/core.service';
import { ADD_SUPERSET_DROPPABLE_ID } from '@/core/training/const/add-superset-droppable-id.const';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
import { MainSet } from '@/core/training/enum/main-set.enum';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { SetState } from '@/lib/common/type/state.type';
import type { IGroupCtx } from '@/store/group.provider';
import type { TrainerDayViewCtxExtended } from '@/store/trainer-day-view.provider';

export async function onDragEndExercise(
  draggableId: string,
  destination: DraggableLocation | null,
  groupCtx: IGroupCtx,
  trainerDayViewCtx: TrainerDayViewCtxExtended
) {
  const { setDetectedChanges } = groupCtx;
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    supersets,
    setSupersets,
  } = trainerDayViewCtx;

  if (!destination || !training || !component || selectedSubgroup?.parentId)
    return; // if virtual subgroup, then disable

  if (destination.droppableId === ADD_SUPERSET_DROPPABLE_ID) {
    if (supersets.length >= NUM_MAX_SUPERSETS)
      toast.error(
        `You can only have ${NUM_MAX_SUPERSETS} supersets per component`
      );

    const _supersets = structuredClone(supersets);
    const superset = _supersets.find((s) =>
      s.exercises.find((e) => e.id === draggableId)
    );

    if (!superset) return;
    const draggedExercise = superset.exercises.find(
      (e) => e.id === draggableId
    );

    if (!draggedExercise) return;

    let newSupersets = [..._supersets, { exercises: [draggedExercise] }];
    superset.exercises = superset.exercises.filter((e) => e.id !== draggableId);
    newSupersets = newSupersets.filter((s) => s.exercises.length > 0);

    setDetectedChanges(true);
    setSupersets(newSupersets);

    if (selectedSubgroup) {
      const updatedSubgroup = { ...selectedSubgroup, supersets: newSupersets };
      const updatedComponent = {
        ...component,
        subgroups: component.subgroups.map((s) =>
          s.id === selectedSubgroup.id ? updatedSubgroup : s
        ),
      };

      updatedComponent.subgroups = updateOnAddExerciseDrop(
        selectedSubgroup,
        updatedComponent,
        draggableId
      );

      setSelectedSubgroup(updatedSubgroup);
      setComponent(updatedComponent);
      updateGlobalStates(training, component, updatedComponent, setTraining);
    } else {
      const updatedComponent = {
        ...component,
        supersets: newSupersets,
      };

      updatedComponent.subgroups = updateOnAddExerciseDrop(
        selectedSubgroup,
        updatedComponent,
        draggableId
      );

      setDetectedChanges(true);
      setComponent(updatedComponent);
      updateGlobalStates(training, component, updatedComponent, setTraining);
    }

    return;
  }

  const updatedSupersets = onDragEndExerciseToExistingSuperset(
    draggableId,
    destination,
    { component, selectedSubgroup, supersets }
  );

  if (!updatedSupersets) return;

  setSupersets(updatedSupersets);

  if (selectedSubgroup) {
    const updatedSubgroup: Subgroup = {
      ...selectedSubgroup,
      supersets: updatedSupersets,
    };

    const updatedComponent: TrainingComponent = {
      ...component,
      subgroups: component.subgroups.map((s) =>
        s.id === selectedSubgroup.id ? updatedSubgroup : s
      ),
    };

    updatedComponent.subgroups = updateOnDragEndExerciseToExistingSuperset(
      draggableId,
      destination,
      updatedComponent,
      updatedSubgroup
    );

    setSelectedSubgroup(updatedSubgroup);
    setComponent(updatedComponent);
    updateGlobalStates(training, component, updatedComponent, setTraining);
  } else {
    const updatedComponent: TrainingComponent = {
      ...component,
      supersets: updatedSupersets,
    };

    updatedComponent.subgroups = updateOnDragEndExerciseToExistingSuperset(
      draggableId,
      destination,
      updatedComponent,
      null
    );

    setComponent(updatedComponent);
    updateGlobalStates(training, component, updatedComponent, setTraining);
  }

  setDetectedChanges(true);
}

export function updateGlobalStates(
  training: Training,
  component: TrainingComponent,
  updatedComponent: TrainingComponent,
  setTraining: SetState<Training | undefined>
) {
  if (component.id === WARMUP_ID || component.id === COOLDOWN_ID) {
    const newTraining = { ...training };
    if (component.id === WARMUP_ID) newTraining.warmup = updatedComponent;
    else newTraining.cooldown = updatedComponent;

    setTraining(newTraining);
  } else {
    const updatedComponents = [...training.components].map((c) =>
      c.id === component.id ? updatedComponent : c
    );

    const newTraining = { ...training, components: updatedComponents };
    setTraining(newTraining);
  }
}

export const onAddExerciseDrop = (
  supersets: Superset[],
  draggableId: string
): Superset[] | undefined => {
  if (supersets.length >= NUM_MAX_SUPERSETS) {
    toast.error(
      `You can only have ${NUM_MAX_SUPERSETS} supersets per component`
    );
    return;
  }

  const supersetsCopy = [...supersets];
  const supersetWithExercise = supersetsCopy.find((s) =>
    s.exercises.find((e) => e.id === draggableId)
  );

  if (!supersetWithExercise) return;
  const draggedExercise = supersetWithExercise?.exercises.find(
    (e) => e.id === draggableId
  );

  if (!draggedExercise) return;

  const newSupersets = [...supersetsCopy, { exercises: [draggedExercise] }];
  supersetWithExercise.exercises = supersetWithExercise.exercises.filter(
    (e) => e.id !== draggableId
  );

  return newSupersets.filter((s) => s.exercises.length > 0);
};

export function onDragEndExerciseToExistingSuperset(
  draggableId: string,
  destination: DraggableLocation,
  state: {
    component: TrainingComponent;
    selectedSubgroup: Subgroup | null;
    supersets: Superset[];
  }
): Superset[] | undefined {
  const { component, selectedSubgroup, supersets } = state;

  const supersetIndex = parseInt(destination.droppableId.split('-')[1]);
  const supersetWithNewExercise = supersets[supersetIndex];
  const supersetsCopy = [...supersets];
  const supersetWithExercise = supersetsCopy.find((superset) =>
    superset.exercises.find((e) => e.id === draggableId)
  );

  if (!supersetWithExercise) return;

  // onDragEnd inside the same superset
  if (supersetWithExercise === supersetWithNewExercise) {
    // Get y coordinates of all exercises in the superset
    const sortedExercises =
      (selectedSubgroup || component).mainSet === MainSet.BLOCK
        ? supersetWithExercise.exercises
            .map((e) => ({
              exercise: e,
              y:
                document.getElementById(e.id)?.getBoundingClientRect().top ??
                Infinity, // Default to Infinity if not found
            }))
            .sort((a, b) => a.y - b.y) // Sort by y coordinate
            .map((item) => item.exercise) // Extract only exercises
        : supersetWithExercise.exercises
            .map((e) => {
              const rect = document
                .getElementById(e.id)
                ?.getBoundingClientRect();
              const top = rect?.top ?? Infinity;
              const left = rect?.left ?? Infinity;
              const height = rect?.height ?? 0;
              const yCenter = isFinite(top) ? top + height / 2 : Infinity;
              return { exercise: e, top, left, height, yCenter };
            })
            .sort((a, b) => {
              // Treat items as same row if their vertical centers are close
              const tol = Math.min(a.height, b.height) * 0.5; // adjust 0.4–0.7 if needed
              if (Math.abs(a.yCenter - b.yCenter) > tol) {
                return a.yCenter - b.yCenter; // different rows → sort by Y
              }
              return a.left - b.left; // same row    → sort by X
            })
            .map((i) => i.exercise);

    return supersetsCopy.map((superset) =>
      superset === supersetWithExercise
        ? { ...supersetWithExercise, exercises: sortedExercises }
        : superset
    );
  }

  // onDragEnd exercise to another existing superset
  if (supersetWithNewExercise.exercises.length >= NUM_MAX_SUPERSETS) {
    toast.error(
      `You can only have ${NUM_MAX_SUPERSETS} exercises per superset`
    );

    return;
  }

  const exerciseIndex = supersetWithExercise.exercises.findIndex(
    (e) => e.id === draggableId
  );

  // ČORI TU MORE BIT UNDEFINED KER !exerciseIndex se kliče tudi te ko je 0!
  if (exerciseIndex === undefined || exerciseIndex === -1) return;

  const exercise = supersetWithExercise.exercises[exerciseIndex];
  supersetWithNewExercise.exercises.push(exercise);

  const newExercises = supersetWithNewExercise.exercises;
  const sortedExercises = newExercises
    .map((e) => ({
      exercise: e,
      y: document.getElementById(e.id)?.getBoundingClientRect().top ?? Infinity, // Default to Infinity if not found
    }))
    .sort((a, b) => a.y - b.y) // Sort by y coordinate
    .map((item) => item.exercise); // Extract only exercises

  supersetWithNewExercise.exercises = sortedExercises;
  const oldFinalSupersetExercises = supersetWithExercise.exercises.filter(
    (e) => e.id !== draggableId
  );

  let finalSupersetsCopy;

  if (oldFinalSupersetExercises.length > 0) {
    finalSupersetsCopy = supersetsCopy.map((superset) =>
      superset === supersetWithExercise
        ? { ...superset, exercises: oldFinalSupersetExercises }
        : superset
    );
  } else {
    finalSupersetsCopy = supersetsCopy.filter(
      (superset) => superset !== supersetWithExercise
    );
  }

  return finalSupersetsCopy;
}

// when exercise is dropped on 'Add/drop exercise' area
function updateOnAddExerciseDrop(
  selectedSubgroup: Subgroup | null,
  component: TrainingComponent,
  draggableId: string
): Subgroup[] {
  const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

  component.subgroups = component.subgroups.map((sg) => {
    if (sg.parentId && sg.parentId === parentId) {
      return {
        ...sg,
        supersets: onAddExerciseDrop(sg.supersets, draggableId) || sg.supersets,
      };
    }

    return sg;
  });

  return component.subgroups;
}

function updateOnDragEndExerciseToExistingSuperset(
  draggableId: string,
  destination: DraggableLocation,
  component: TrainingComponent,
  selectedSubgroup: Subgroup | null
): Subgroup[] {
  const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

  component.subgroups = component.subgroups.map((sg) => {
    if (sg.parentId && sg.parentId === parentId) {
      const newSupersets = onDragEndExerciseToExistingSuperset(
        draggableId,
        destination,
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
}

export function updateMainSet(input: {
  component: TrainingComponent;
  selectedSubgroup: Subgroup | null;
  mainSet: MainSet;
}): Subgroup[] {
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
}

export function removeExerciseFromSuperset(
  component: TrainingComponent,
  selectedSubgroup: Subgroup | null,
  supersetIndex: number,
  exerciseIndex: number
): Subgroup[] {
  const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

  component.subgroups = component.subgroups.map((sg) => {
    if (sg.parentId && sg.parentId === parentId) {
      const newSupersets = core.training.superset.removeExercise(
        sg.supersets,
        exerciseIndex,
        supersetIndex
      );

      return { ...sg, supersets: newSupersets };
    }
    return sg;
  });

  return component.subgroups;
}

export function removeSelectedExercises(
  component: TrainingComponent,
  selectedSubgroup: Subgroup | null,
  selectedExerciseIds: string[]
) {
  const parentId = selectedSubgroup?.id || DEFAULT_SUBGROUP_ID;

  component.subgroups = component.subgroups.map((sg) => {
    if (sg.parentId && sg.parentId === parentId) {
      const newSupersets = removeSelectedExercisesFromSupersets(
        sg.supersets,
        selectedExerciseIds
      );

      return { ...sg, supersets: newSupersets };
    }
    return sg;
  });

  return component.subgroups;
}
