import ReactDOM from 'react-dom';

import type { SetState, SetStateNullable } from '@/lib/common/type/state.type';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';

export function updateTraining(
  exercises: TrainingExercise[],
  state: {
    training: Training;
    component: TrainingComponent | null;
    supersets: Superset[];
    setDetectedChanges: SetState<boolean>;
    selectedSubgroup: Subgroup | null;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setTraining: SetStateNullable<Training>;
    setSupersets?: SetState<Superset[]>;
  }
) {
  const {
    training,
    component,
    supersets,
    setDetectedChanges,
    selectedSubgroup,
    setSelectedSubgroup,
    setTraining,
    setSupersets,
  } = state;

  if (!training || !component) return;

  const newSupersets = [...supersets];
  let updatedSubgroup = selectedSubgroup ? { ...selectedSubgroup } : undefined;
  let updatedComponent = { ...component };
  let detectedChanges = false;

  for (const exercise of exercises) {
    const sI = supersets.findIndex((s) =>
      s.exercises.some((e) => e.id === exercise.id)
    );

    if (sI === -1) continue;

    const newSuperset = { ...newSupersets[sI] };
    const eI = newSuperset.exercises.findIndex((e) => e.id === exercise.id);
    if (eI === -1) continue;

    newSuperset.exercises[eI] = { ...exercise };
    newSupersets[sI] = newSuperset;
    detectedChanges = true;
  }

  if (!detectedChanges) return;

  ReactDOM.unstable_batchedUpdates(() => {
    setDetectedChanges(true);

    if (selectedSubgroup) {
      updatedSubgroup = { ...updatedSubgroup!, supersets: newSupersets };
      updatedComponent = {
        ...updatedComponent,
        subgroups: updatedComponent.subgroups.map((s) =>
          s.id === updatedSubgroup?.id ? updatedSubgroup! : s
        ),
      };

      const updatedComponents = training.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      );

      const newTraining = { ...training, components: updatedComponents };

      if (setSupersets) setSupersets(newSupersets);
      setSelectedSubgroup(updatedSubgroup!);
      setTraining(newTraining);
    } else {
      updatedComponent = { ...updatedComponent, supersets: newSupersets };
      const updatedComponents = training.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      );

      const newTraining = { ...training, components: updatedComponents };

      if (setSupersets) setSupersets(newSupersets);
      setTraining(newTraining);
    }
  });
}
