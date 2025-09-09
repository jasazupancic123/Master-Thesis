import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type React from 'react';
import toast from 'react-hot-toast';

import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Method } from '@/controller/method/type/method.type';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { User } from '@/controller/user/type/user.type';

export async function handleUpdateMultipleTrainings(state: {
  setTrainings: SetState<Training[]>;
  training: Training | undefined;
  setTraining: SetState<Training | undefined>;
  group: Group;
  cycle: Cycle | undefined;
  router: AppRouterInstance;
  components: Component[];
  exercises: Exercise[];
  methods: Method[];
  setDetectedChanges: SetState<boolean>;
  selectedAthlete: User | undefined;
  isSettingAthleteWorkloads: React.RefObject<boolean>;
  setIsUpdatingTraining: SetState<boolean>;
}) {
  const {
    setTrainings,
    training,
    setTraining,
    router,
    components,
    exercises,
    methods,
    setDetectedChanges,
    setIsUpdatingTraining,
  } = state;

  if (!training) {
    toast.error('No training to update');
    return;
  }

  setIsUpdatingTraining(true);

  await handleApiRequest(
    router,
    () =>
      TrainingController.update(training.id, {
        ...training,
      }),
    (newTraining) => {
      TrainingService.mapData(newTraining, {
        components,
        exercises,
        methods,
      });

      setTraining(newTraining);

      setTrainings((prev) =>
        prev.map((t) => {
          if (t.id === newTraining.id) return newTraining;
          return t;
        })
      );

      setDetectedChanges(false);
      toast.success('Training updated successfully');
    },
    undefined,
    'Error when updating training'
  );

  setIsUpdatingTraining(false);
}

export const removeSelectedExercisesFromSupersets = (
  supersets: Superset[],
  selectedExercises: TrainingExercise[]
): Superset[] => {
  supersets = supersets.map((s) => ({
    ...s,
    exercises: s.exercises.filter(
      (e) => !selectedExercises.some((se) => se.id === e.id)
    ),
  }));

  return supersets.filter((s) => s.exercises.length > 0);
};

export function deleteSelectedExercises(
  input: {
    selectedExercises: TrainingExercise[];
  },
  state: {
    component: TrainingComponent | undefined;
    training: Training | undefined;
    setComponent: SetState<TrainingComponent | undefined>;
    setTraining: SetState<Training | undefined>;
    setSelectedExercises: SetState<TrainingExercise[]>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setDetectedChanges: SetState<boolean>;
  }
) {
  const { selectedExercises } = input;

  const {
    component,
    training,
    setComponent,
    setTraining,
    setSelectedExercises,
    selectedSubgroup,
    setSelectedSubgroup,
    setDetectedChanges,
  } = state;

  if (!selectedExercises.length || !component || !training) return;

  // if it's custom workloads subgroup, then dissable
  if (selectedSubgroup?.parentId) return;

  const newComponent = { ...component };

  if (selectedSubgroup) {
    const newSubgroup = { ...selectedSubgroup };
    newSubgroup.supersets = removeSelectedExercisesFromSupersets(
      newSubgroup.supersets,
      selectedExercises
    );

    setSelectedSubgroup((prev) => (!prev ? null : newSubgroup));

    newComponent.subgroups = (newComponent.subgroups || []).map((sg) =>
      sg.id === selectedSubgroup.id ? newSubgroup : sg
    );
  } else {
    newComponent.supersets = removeSelectedExercisesFromSupersets(
      newComponent.supersets,
      selectedExercises
    );
  }

  newComponent.subgroups =
    CustomWorkloadsSubgroupsService.removeSelectedExercises(
      newComponent,
      selectedSubgroup,
      selectedExercises
    );

  const newTraining = { ...training };

  if (newComponent.id === WARMUP_ID) newTraining.warmup = newComponent;
  else if (newComponent.id === COOLDOWN_ID) newTraining.cooldown = newComponent;
  else
    newTraining.components = newTraining.components.map((c) =>
      c.id === component.id ? newComponent : c
    );

  setComponent(newComponent);
  setTraining(newTraining);
  setSelectedExercises([]);
  setDetectedChanges(true);
}
