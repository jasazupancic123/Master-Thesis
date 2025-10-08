import useTrainingExerciseCardContainerSubgroups from '@/components/training-exercise-card/training-exercise-card-container/hooks/use-subgroups.hook';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { ExerciseSet } from '@/controller/training/type/exercise-set.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Superset } from '@/controller/training/type/superset.type';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function useTrainingExerciseSetsExerciseParam() {
  const { selectedAthlete, selectedSubgroup, selectedExercises, supersets } =
    useTrainerDayViewContext();

  const { actions: subgroupsActions } =
    useTrainingExerciseCardContainerSubgroups();

  const { setsNumbers } = useSupersets();
  const actions = {
    getCorrectValuesForExerciseParam(input: {
      exercise: TrainingExercise;
      set?: ExerciseSet;
      param?: Attribute;
    }): {
      correctSelectedSubgroup: Subgroup | null;
      correctSupersets: Superset[];
      correctSelectedExercises: TrainingExercise[];
      correctSetsNumbers: { exerciseId: string; setsNumber: number }[];
      correctExercise: TrainingExercise;
      correctSet?: ExerciseSet;
      correctParam?: Attribute;
    } | null {
      const { exercise, set, param } = input;

      if (selectedAthlete) {
        const customWorkloadsSubgroup =
          subgroupsActions.getOrCreateCustomWorkloadsSubgroup();

        if (!customWorkloadsSubgroup) return null;

        const fields = subgroupsActions.getFieldsFromSubgroup({
          subgroup: customWorkloadsSubgroup,
          exercise,
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
    },
  };

  return { actions };
}
