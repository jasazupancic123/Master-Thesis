import ReactDOM from 'react-dom';

import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export function updateTraining(
  input: {
    exercises: TrainingExercise[];
  },
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
  const { exercises } = input;

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

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    const supersetIndex = supersets.findIndex((s) =>
      s.exercises.some((e) => e.id === exercise.id)
    );
    if (supersetIndex === -1) continue;

    const newSuperset = { ...newSupersets[supersetIndex] };
    const exerciseIndex = newSuperset.exercises.findIndex(
      (e) => e.id === exercise.id
    );
    if (exerciseIndex === -1 || !training || !component) continue;

    newSuperset.exercises[exerciseIndex] = { ...exercise };
    newSupersets[supersetIndex] = newSuperset;
    detectedChanges = true;
  }

  if (!detectedChanges) return;

  ReactDOM.unstable_batchedUpdates(() => {
    setDetectedChanges(true);

    if (selectedSubgroup) {
      updatedSubgroup = {
        ...updatedSubgroup!,
        supersets: newSupersets,
      };

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

      if (setSupersets) {
        setSupersets(newSupersets);
      }

      setSelectedSubgroup(updatedSubgroup!);

      setTraining(newTraining);
    } else {
      updatedComponent = {
        ...updatedComponent,
        supersets: newSupersets,
      };

      const updatedComponents = training.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      );

      const newTraining = {
        ...training,
        components: updatedComponents,
      };

      if (setSupersets) {
        setSupersets(newSupersets);
      }

      setTraining(newTraining);
    }
  });
}
