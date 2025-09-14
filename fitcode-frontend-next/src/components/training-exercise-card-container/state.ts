import {
  getFieldsFromSubgroup,
  getOrCreateCustomWorkloadsSubgroup,
} from '../training-members/state';
import type { SetState } from '@/common/type/state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

export function getCorrectValuesForExerciseParam(
  selectedAthlete: AuthUser | undefined,
  input: {
    exercise: TrainingExercise;
  },
  state: {
    component: TrainingComponent;
    supersets: Superset[];
    selectedExercises: TrainingExercise[];
    setsNumbers: { exerciseId: string; setsNumber: number }[];
    selectedSubgroup: Subgroup | null;
    set?: ExerciseSet;
    param?: Attribute;
    setComponent: SetState<TrainingComponent | undefined>;
    setSelectedSubgroup: SetState<Subgroup | null>;
    setTraining: SetState<Training | undefined>;
    setSupersets: SetState<Superset[]>;
    setSelectedExercises: SetState<TrainingExercise[]>;
    setSetsNumbers: SetState<{ exerciseId: string; setsNumber: number }[]>;
  }
): {
  correctSelectedSubgroup: Subgroup | null;
  correctSupersets: Superset[];
  correctSelectedExercises: TrainingExercise[];
  correctSetsNumbers: { exerciseId: string; setsNumber: number }[];
  correctExercise: TrainingExercise;
  correctSet?: ExerciseSet;
  correctParam?: Attribute;
} {
  const { exercise } = input;

  const {
    component,
    selectedSubgroup,
    supersets,
    selectedExercises,
    setsNumbers,
    set,
    param,
    setComponent,
    setSelectedSubgroup,
    setTraining,
    setSupersets,
    setSelectedExercises,
    setSetsNumbers,
  } = state;

  if (selectedAthlete) {
    const customWorkloadsSubgroup = getOrCreateCustomWorkloadsSubgroup({
      selectedAthlete,
      component,
      setComponent,
      selectedSubgroup,
      setSelectedSubgroup,
      setTraining,
    });

    const fields = getFieldsFromSubgroup(customWorkloadsSubgroup, {
      selectedExercises,
      exercise,
      setSupersets,
      setSelectedExercises,
      setSetsNumbers,
    });

    return {
      correctSelectedSubgroup: customWorkloadsSubgroup,
      correctSupersets: fields.supersets,
      correctSelectedExercises: fields.selectedExercises,
      correctSetsNumbers: fields.setsNumbers,
      correctExercise: fields.exercise || exercise,
      correctSet: (fields.exercise || exercise).sets.find(
        (s) => s.setNumber === set?.setNumber
      ),
      correctParam: (fields.exercise || exercise).params.find(
        (p) => p.field === param?.field
      ),
    };
  }

  return {
    correctSelectedSubgroup: selectedSubgroup,
    correctSupersets: supersets,
    correctSelectedExercises: selectedExercises,
    correctSetsNumbers: setsNumbers,
    correctExercise: exercise,
    correctSet: set,
    correctParam: param,
  };
}
