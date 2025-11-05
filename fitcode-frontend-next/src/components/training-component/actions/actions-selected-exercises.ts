import { removeSelectedExercises } from '@/components/supersets/actions/actions-drag-exercise';
import type { Superset } from '@/core/training/type/superset.type';
import type { IGroupCtx } from '@/store/group.provider';
import type { ITrainerDayViewContext } from '@/store/trainer-day-view.provider';

export function handleSelectedExercisesSelection(
  context: ITrainerDayViewContext
) {
  const { selectedExerciseIds, setSelectedExerciseIds, supersets } = context;
  const allExercisesSelected = supersets.every((s) =>
    s.exercises.every((e) =>
      selectedExerciseIds.some((selectedId) => selectedId === e.id)
    )
  );

  if (allExercisesSelected) setSelectedExerciseIds([]);
  else
    setSelectedExerciseIds(
      supersets.flatMap((s) => s.exercises.map((e) => e.id)) || []
    );
}

export function deleteSelectedExercises(
  selectedExerciseIds: string[],
  context: {
    useTrainerDayViewContext: ITrainerDayViewContext;
    useGroup: IGroupCtx;
  }
) {
  const { useTrainerDayViewContext, useGroup } = context;

  const {
    component,
    training,
    setComponent,
    setTraining,
    setSelectedExerciseIds,
    selectedSubgroup,
    setSelectedSubgroup,
  } = useTrainerDayViewContext;

  const { setDetectedChanges } = useGroup;

  if (!selectedExerciseIds.length || !component || !training) return;

  // if it's custom workloads subgroup, then dissable
  if (selectedSubgroup?.parentId) return;

  const newComponent = { ...component };

  if (selectedSubgroup) {
    const newSubgroup = { ...selectedSubgroup };
    newSubgroup.supersets = removeSelectedExercisesFromSupersets(
      newSubgroup.supersets,
      selectedExerciseIds
    );

    setSelectedSubgroup((prev) => (!prev ? null : newSubgroup));

    newComponent.subgroups = (newComponent.subgroups || []).map((sg) =>
      sg.id === selectedSubgroup.id ? newSubgroup : sg
    );
  } else {
    newComponent.supersets = removeSelectedExercisesFromSupersets(
      newComponent.supersets,
      selectedExerciseIds
    );
  }

  newComponent.subgroups = removeSelectedExercises(
    newComponent,
    selectedSubgroup,
    selectedExerciseIds
  );

  const newTraining = { ...training };
  newTraining.components = newTraining.components.map((c) =>
    c.id === component.id ? newComponent : c
  );

  setComponent(newComponent);
  setTraining(newTraining);
  setSelectedExerciseIds([]);
  setDetectedChanges(true);
}

export const removeSelectedExercisesFromSupersets = (
  supersets: Superset[],
  selectedExerciseIds: string[]
): Superset[] => {
  supersets = supersets.map((s) => ({
    ...s,
    exercises: s.exercises.filter(
      (e) => !selectedExerciseIds.some((se) => se === e.id)
    ),
  }));

  return supersets.filter(
    (s) => s.cooldown || s.warmup || s.exercises.length > 0
  );
};
