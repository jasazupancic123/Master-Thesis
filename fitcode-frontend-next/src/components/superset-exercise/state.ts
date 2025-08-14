import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export default function deleteSupersetExercise(input: {
  supersetIndex: number;
  exerciseIndex: number;
  exercise: TrainingExercise;
  selectedSubgroup: Subgroup | null;
  setSelectedSubgroup: SetState<Subgroup | null>;
  component: TrainingComponent;
  setComponent: SetStateNullable<TrainingComponent>;
  training: Training;
  setTraining: SetStateNullable<Training>;
  setTrainings: SetState<Training[]>;
  setAnchorEl: SetState<HTMLElement | null>;
  setSelectedExercises: SetState<TrainingExercise[]>;
}) {
  const {
    supersetIndex,
    exerciseIndex,
    exercise,
    selectedSubgroup,
    setSelectedSubgroup,
    component,
    setComponent,
    training,
    setTraining,
    setTrainings,
    setAnchorEl,
    setSelectedExercises,
  } = input;

  const updatedSubgroup: Subgroup | null = selectedSubgroup
    ? {
        ...selectedSubgroup,
        supersets: selectedSubgroup.supersets.map((s, i) =>
          i !== supersetIndex
            ? s
            : {
                ...s,
                exercises: s.exercises.filter((ex, k) => k !== exerciseIndex),
              }
        ),
      }
    : null;

  if (updatedSubgroup) setSelectedSubgroup(updatedSubgroup);

  const updatedComponent = updatedSubgroup
    ? {
        ...component,
        subgroups: component.subgroups.map((sg) =>
          sg.id === updatedSubgroup.id ? updatedSubgroup : sg
        ),
      }
    : {
        ...component,
        supersets: component.supersets.map((s, i) =>
          i !== supersetIndex
            ? s
            : {
                ...s,
                exercises: s.exercises.filter((ex, k) => k !== exerciseIndex),
              }
        ),
      };

  setComponent(updatedComponent);

  const updatedTraining: Training = {
    ...training,
  };

  if (component.id === WARMUP_ID) {
    updatedTraining.warmup = updatedComponent;
  } else if (component.id === COOLDOWN_ID) {
    updatedTraining.cooldown = updatedComponent;
  } else {
    updatedTraining.components = training.components.map((c) =>
      c.id === component.id ? updatedComponent : c
    );
  }

  setTraining(updatedTraining);
  setTrainings((prev) =>
    prev.map((t) => (t.id === updatedTraining.id ? updatedTraining : t))
  );

  setSelectedExercises((prev) => prev.filter((ex) => ex.id !== exercise.id));
  setAnchorEl(null);
}
