import type { DraggableLocation, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

import { DEFAULT_SUBGROUP_ID, NUM_MAX_SUPERSETS } from './constant';
import { ADD_SUPERSET_DROPPABLE_ID } from '@/common/constant/add-superset-droppable-id.constant';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { VolType } from '@/controller/component/enum/param.enum';
import { IntType } from '@/controller/component/enum/param.enum';
import { ParamType } from '@/controller/component/enum/param.enum';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import type { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { WorkloadValue } from '@/controller/training/type/workload-value.type';

export function handleDeleteSubgroup(
  input: { subgroupId: string },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedExercises: TrainingExercise[];
    setSelectedExercises: SetState<TrainingExercise[]>;
    setTrainings: SetState<Training[]>;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { subgroupId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedExercises,
    setSelectedExercises,
    setTrainings,
    setSelectedSubgroup,
    setDetectedChanges,
  } = state;
  if (!training || !component) return;

  setDetectedChanges(true);

  const subgroupsCopy = [...component.subgroups];
  const deletingSubgroup = subgroupsCopy.find((sg) => sg.id === subgroupId);

  let updatedSubgroups = subgroupsCopy.filter(
    (subgroup) => subgroup.id !== subgroupId
  );

  if (deletingSubgroup) {
    deletingSubgroup.membersIds.forEach((memberId) => {
      const foundCustomUserSubgroup = component.subgroups.find(
        (subgroup) =>
          subgroup.parentId && subgroup.membersIds.includes(memberId)
      );

      if (!foundCustomUserSubgroup) return;

      updatedSubgroups = updatedSubgroups.filter(
        (sg) => sg.id !== foundCustomUserSubgroup?.id
      );
    });
  }

  const newComponent = {
    ...component,
    subgroups: updatedSubgroups,
  };

  setComponent(newComponent);

  const updatedComponents = [...training.components].map((c) =>
    c.id === component.id ? newComponent : c
  );

  const newTraining: Training =
    newComponent.id === WARMUP_ID
      ? { ...training, warmup: newComponent }
      : newComponent.id === COOLDOWN_ID
        ? { ...training, cooldown: newComponent }
        : {
            ...training,
            components: updatedComponents,
          };

  setTraining(newTraining);
  setTrainings((prev) =>
    prev.map((t) => (t.id === training.id ? newTraining : t))
  );

  setSelectedSubgroup(null);
  setSelectedExercises(
    component?.supersets
      .flatMap((s) => s.exercises)
      .filter((e) => selectedExercises.some((se) => se.id === e.id)) || []
  );
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

export const onDragEndExerciseToExistingSuperset = (
  input: {
    draggableId: string;
    destination: DraggableLocation;
  },
  state: {
    component: TrainingComponent;
    selectedSubgroup: Subgroup | null;
    supersets: Superset[];
  }
): Superset[] | undefined => {
  const { destination, draggableId } = input;
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

    const newSuperset = {
      ...supersetWithExercise,
      exercises: sortedExercises,
    };

    return supersetsCopy.map((superset) =>
      superset === supersetWithExercise ? newSuperset : superset
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
};

export async function onDragEndExercise(
  input: {
    draggableId: string;
    destination: DraggableLocation | null | undefined;
  },
  state: {
    training: Training;
    setTraining: SetStateNullable<Training>;
    component: TrainingComponent;
    setComponent: SetStateNullable<TrainingComponent>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    supersets: Superset[];
    setSupersets: SetState<Superset[]>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { destination, draggableId } = input;
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    supersets,
    setSupersets,
    setDetectedChanges,
  } = state;

  if (!destination || !training || !component) return;

  // if it's custom workloads subgroup, then dissable
  if (selectedSubgroup?.parentId) return;

  if (destination.droppableId === ADD_SUPERSET_DROPPABLE_ID) {
    const newSupersets = onAddExerciseDrop(supersets, draggableId);

    if (!newSupersets) return;

    setDetectedChanges(true);

    setSupersets([...newSupersets]);

    if (selectedSubgroup) {
      const updatedSubgroup = {
        ...selectedSubgroup,
        supersets: newSupersets,
      };
      const updatedComponent = {
        ...component,
        subgroups: component.subgroups.map((s) =>
          s.id === selectedSubgroup.id ? updatedSubgroup : s
        ),
      };

      updatedComponent.subgroups =
        CustomWorkloadsSubgroupsService.updateOnAddExerciseDrop(
          selectedSubgroup,
          updatedComponent,
          draggableId
        );

      setSelectedSubgroup(updatedSubgroup);
      setComponent(updatedComponent);

      updateGlobalStates(
        training,
        component,
        updatedComponent,
        setTraining,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );
    } else {
      const updatedComponent = {
        ...component,
        supersets: newSupersets,
      };

      updatedComponent.subgroups =
        CustomWorkloadsSubgroupsService.updateOnAddExerciseDrop(
          selectedSubgroup,
          component,
          draggableId
        );

      setDetectedChanges(true);

      setComponent(updatedComponent);

      updateGlobalStates(
        training,
        component,
        updatedComponent,
        setTraining,
        component.id === WARMUP_ID || component.id === COOLDOWN_ID
      );
    }

    return;
  }

  const updatedSupersets = onDragEndExerciseToExistingSuperset(
    {
      draggableId,
      destination,
    },
    {
      component,
      selectedSubgroup,
      supersets,
    }
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

    updatedComponent.subgroups =
      CustomWorkloadsSubgroupsService.updateOnDragEndExerciseToExistingSuperset(
        draggableId,
        destination,
        updatedComponent,
        updatedSubgroup
      );

    setSelectedSubgroup(updatedSubgroup);

    setComponent(updatedComponent);

    updateGlobalStates(
      training,
      component,
      updatedComponent,
      setTraining,
      component.id === WARMUP_ID || component.id === COOLDOWN_ID
    );
  } else {
    const updatedComponent: TrainingComponent = {
      ...component,
      supersets: updatedSupersets,
    };

    updatedComponent.subgroups =
      CustomWorkloadsSubgroupsService.updateOnDragEndExerciseToExistingSuperset(
        draggableId,
        destination,
        updatedComponent,
        null
      );

    setComponent(updatedComponent);

    updateGlobalStates(
      training,
      component,
      updatedComponent,
      setTraining,
      component.id === WARMUP_ID || component.id === COOLDOWN_ID
    );
  }

  setDetectedChanges(true);
}

export function updateGlobalStates(
  training: Training,
  component: TrainingComponent,
  updatedComponent: TrainingComponent,
  setTraining: SetState<Training | undefined>,
  warmupOrCooldown: boolean
) {
  if (warmupOrCooldown) {
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
