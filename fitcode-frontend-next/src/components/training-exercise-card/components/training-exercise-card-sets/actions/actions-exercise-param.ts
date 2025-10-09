import { Attribute } from '@/controller/attribute/type/attribute.type';
import { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Superset } from '@/controller/training/type/superset.type';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { SupersetsProviderReturnType } from '@/store/supersets.provider';
import { TrainerDayViewProviderReturnTypeDefined } from '@/store/trainer-day-view.provider';
import {
  getFieldsFromSubgroup,
  getOrCreateCustomWorkloadsSubgroup,
} from '../../training-exercise-card-container/actions/actions-subgroup';

export function getCorrectValuesForExerciseParam(
  input: {
    exercise: TrainingExercise;
    set?: ExerciseSet;
    param?: Attribute;
  },
  context: {
    useTrainerDayView: TrainerDayViewProviderReturnTypeDefined;
    useSupersets: SupersetsProviderReturnType;
  }
): {
  correctSelectedSubgroup: Subgroup | null;
  correctSupersets: Superset[];
  correctSelectedExercises: TrainingExercise[];
  correctSetsNumbers: { exerciseId: string; setsNumber: number }[];
  correctExercise: TrainingExercise;
  correctSet?: ExerciseSet;
  correctParam?: Attribute;
} | null {
  const { exercise, set, param } = input;

  const { useTrainerDayView, useSupersets } = context;

  const { setsNumbers } = useSupersets;

  const { selectedAthlete, supersets, selectedSubgroup, selectedExercises } =
    useTrainerDayView;

  if (selectedAthlete) {
    const customWorkloadsSubgroup = getOrCreateCustomWorkloadsSubgroup({
      useTrainerDayView,
    });

    if (!customWorkloadsSubgroup) return null;

    const fields = getFieldsFromSubgroup(
      {
        subgroup: customWorkloadsSubgroup,
        exercise,
      },
      {
        useTrainerDayView,
        useSupersets,
      }
    );

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
