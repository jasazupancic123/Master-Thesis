import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Method } from '@/controller/method/type/method.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { TrainingInfo } from '@/controller/training/type/training.type';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { Training } from '@/controller/training/type/training.type';
import { Workload } from '@/controller/training/type/workload.type';
import { User } from '@/controller/user/type/user.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export async function handleUpdateMultipleTrainings(state: {
  setTrainings: SetState<TrainingInfo[]>;
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
  setSelectedAthlete: SetState<User | undefined>;
  setDetectedChanges: SetState<boolean>;
}) {
  const {
    setTrainings,
    training,
    setTraining,
    group,
    cycle,
    router,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    components,
    exercises,
    methods,
    setSelectedAthlete,
    setDetectedChanges,
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
      const mapped = TrainingService.mapComponentsExercisesMethods(
        newTraining,
        components,
        exercises,
        methods
      );

      const minimalTraining =
        TrainingService.convertFromTrainingToTrainingMinimal(newTraining);

      setTraining(mapped);

      setTrainings((prev) =>
        prev.map((t) => {
          if (t.id === minimalTraining.id) return minimalTraining;
          return t;
        })
      );

      setSelectedAthlete(undefined);

      setCustomAthleteWorkloads([]);

      setDetectedChanges(false);
      toast.success('Trainings updated successfully');
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
    selectedSubgroup: {
      subgroup: Subgroup | null;
      index: number;
    } | null;
    setSelectedSubgroup: SetState<{
      subgroup: Subgroup | null;
      index: number;
    } | null>;
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

  if (selectedSubgroup?.subgroup) {
    const newSubgroup = { ...selectedSubgroup.subgroup };
    newSubgroup.supersets = (newSubgroup.supersets || []).map((s) => ({
      ...s,
      exercises: s.exercises.filter(
        (e) => !selectedExercises.some((se) => se.id === e.id)
      ),
    }));

    newSubgroup.supersets = newSubgroup.supersets.filter(
      (s) => s.exercises.length > 0
    );

    setSelectedSubgroup((prev) =>
      !prev
        ? null
        : {
            ...prev,
            subgroup: newSubgroup,
          }
    );
    newComponent.subgroups = (newComponent.subgroups || []).map((sg) =>
      sg.id === selectedSubgroup.subgroup?.id ? newSubgroup : sg
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
