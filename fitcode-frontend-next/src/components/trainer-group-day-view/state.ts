import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type React from 'react';
import toast from 'react-hot-toast';

import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Method } from '@/controller/method/type/method.type';
import { COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE } from '@/controller/training/constant/completed-future-workloads-default-value.constant';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { User } from '@/controller/user/type/user.type';

export async function handleUpdateMultipleTrainings(state: {
  setTrainings: SetState<Training[]>;
  training: Training | undefined;
  setTraining: SetState<Training | undefined>;
  group: Group;
  cycle: Cycle | undefined;
  router: AppRouterInstance;
  customAthleteWorkloads: Workload[];
  setCustomAthleteWorkloads: SetState<Workload[]>;
  components: Component[];
  exercises: Exercise[];
  methods: Method[];
  setDetectedChanges: SetState<boolean>;
  selectedAthlete: User | undefined;
  setSelectedAthleteWorkloads: SetState<CompletedFutureWorkloads>;
  isSettingAthleteWorkloads: React.RefObject<boolean>;
}) {
  const {
    setTrainings,
    training,
    setTraining,
    router,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    components,
    exercises,
    methods,
    setDetectedChanges,
    selectedAthlete,
    setSelectedAthleteWorkloads,
    isSettingAthleteWorkloads,
  } = state;

  if (!training) {
    toast.error('No training to update');
    return;
  }

  await handleApiRequest(
    router,
    () =>
      TrainingController.update(training.id, {
        ...training,
        workloads: customAthleteWorkloads,
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

      if (selectedAthlete) {
        fetchWorkloads({
          selectedAthlete,
          training,
          setSelectedAthleteWorkloads,
          isSettingAthleteWorkloads,
          router,
        });
      } else setCustomAthleteWorkloads([]);

      setDetectedChanges(false);
      toast.success('Training updated successfully');
    },
    undefined,
    'Error when updating training'
  );
}

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

  const newComponent = { ...component };

  if (selectedSubgroup) {
    const newSubgroup = { ...selectedSubgroup };
    newSubgroup.supersets = (newSubgroup.supersets || []).map((s) => ({
      ...s,
      exercises: s.exercises.filter(
        (e) => !selectedExercises.some((se) => se.id === e.id)
      ),
    }));

    newSubgroup.supersets = newSubgroup.supersets.filter(
      (s) => s.exercises.length > 0
    );

    setSelectedSubgroup((prev) => (!prev ? null : newSubgroup));

    newComponent.subgroups = (newComponent.subgroups || []).map((sg) =>
      sg.id === selectedSubgroup.id ? newSubgroup : sg
    );
  } else {
    newComponent.supersets = newComponent.supersets?.map((s) => ({
      ...s,
      exercises: s.exercises.filter(
        (e) => !selectedExercises.some((se) => se.id === e.id)
      ),
    }));

    newComponent.supersets = newComponent.supersets?.filter(
      (s) => s.exercises.length > 0
    );
  }

  const newTraining = { ...training };
  newTraining.components = newTraining.components.map((c) =>
    c.id === component.id ? newComponent : c
  );

  setComponent(newComponent);
  setTraining(newTraining);
  setSelectedExercises([]);
  setDetectedChanges(true);
}

export async function fetchWorkloads(input: {
  selectedAthlete: User | undefined;
  training: Training | undefined;
  setSelectedAthleteWorkloads: SetState<CompletedFutureWorkloads>;
  isSettingAthleteWorkloads: React.RefObject<boolean>;
  router: AppRouterInstance;
}) {
  const {
    selectedAthlete,
    training,
    setSelectedAthleteWorkloads,
    isSettingAthleteWorkloads,
    router,
  } = input;
  if (!selectedAthlete) return;

  const combinedComponents = training?.components;

  if (!combinedComponents || !combinedComponents.length) {
    setSelectedAthleteWorkloads(COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE);
    return;
  }

  const uniqueExerciseIds = [] as string[];
  combinedComponents.forEach((c) => {
    c.supersets.forEach((s) => {
      s.exercises.forEach((e) => {
        if (!uniqueExerciseIds.includes(e.id)) uniqueExerciseIds.push(e.id);
      });
    });
  });

  if (!uniqueExerciseIds.length) {
    setSelectedAthleteWorkloads(COMPLETED_FUTURE_WORKLOADS_DEFAULT_VALUE);
    return;
  }

  isSettingAthleteWorkloads.current = true;
  handleApiRequest(
    router,
    () =>
      TrainingController.findAthleteWorkloads(training.id, selectedAthlete.uid),
    (workloads) => {
      setSelectedAthleteWorkloads(workloads);
      isSettingAthleteWorkloads.current = false;
    },
    undefined,
    'Failed to fetch workloads'
  );
  isSettingAthleteWorkloads.current = false;
}
