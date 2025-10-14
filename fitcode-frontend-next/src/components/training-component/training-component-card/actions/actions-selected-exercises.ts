import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import type { Superset } from '@/controller/training/type/superset.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { GroupProviderReturnType } from '@/store/group.provider';
import type { TrainerDayViewProviderReturnType } from '@/store/trainer-day-view.provider';

export function handleSelectedExercisesSelection(context: {
  useTrainerDayViewContext: TrainerDayViewProviderReturnType;
}) {
  const { useTrainerDayViewContext } = context;

  const { selectedExercises, setSelectedExercises, supersets } =
    useTrainerDayViewContext;

  const allExercisesSelected = supersets.every((s) =>
    s.exercises.every((e) => selectedExercises.some((se) => se.id === e.id))
  );
  if (allExercisesSelected) {
    setSelectedExercises([]);
  } else {
    setSelectedExercises(supersets.flatMap((s) => s.exercises) || []);
  }
}

export function deleteSelectedExercises(
  input: {
    selectedExercises: TrainingExercise[];
  },
  context: {
    useTrainerDayViewContext: TrainerDayViewProviderReturnType;
    useGroup: GroupProviderReturnType;
  }
) {
  const { selectedExercises } = input;

  const { useTrainerDayViewContext, useGroup } = context;

  const {
    component,
    training,
    setComponent,
    setTraining,
    setSelectedExercises,
    selectedSubgroup,
    setSelectedSubgroup,
  } = useTrainerDayViewContext;

  const { setDetectedChanges } = useGroup;

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
