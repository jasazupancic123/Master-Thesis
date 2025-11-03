import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank,
} from '@mui/icons-material';
import { Checkbox, useTheme } from '@mui/material';

import {
  finishSet,
  isExerciseSetCompleted,
  unmarkExerciseSetAsCompleted,
} from './actions/actions-exercise-set';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

interface TrainingExerciseSetDoneCheckboxProps {
  exercise: TrainingExercise;
  setIndex: number;
  exerciseView?: boolean; // if we clicked this from the exercise, or the "undone sets" list
  small?: boolean;
  applyTopMargin?: boolean;
}

export default function TrainingExerciseSetDoneCheckbox(
  props: TrainingExerciseSetDoneCheckboxProps
) {
  const theme = useTheme();

  const { trainingInProgress, setTrainingInProgress } = useTraining();

  const {
    setSelectedExercise,
    handleUpsertSet,
    setSetIndex,
    supersetIndex,
    setSupersetIndex,
  } = useTrainingInProgress();

  const { exercise, applyTopMargin, exerciseView, small, setIndex } = props;

  if (!exercise || !trainingInProgress) {
    return null;
  }

  const handleAdvanceInSuperset = () => {
    if (!exerciseView || supersetIndex === undefined) return;

    const currentSuperset =
      trainingInProgress.selectedComponent.supersets[supersetIndex];

    if (!currentSuperset) return;

    const exercisesInCurrentSuperset = currentSuperset.exercises;

    // Check if every set in the current superset is completed
    const allSetsCompleted = exercisesInCurrentSuperset.every((ex) => {
      const exerciseSetTracking =
        trainingInProgress.exerciseSetTrackingState.find(
          (s) => s.exerciseId === ex.id
        );

      if (!exerciseSetTracking) return false;

      return exerciseSetTracking.completedSetNumbers.length >= ex.sets.length;
    });

    if (allSetsCompleted) {
      // Move to next superset

      const isLastSuperset =
        supersetIndex ===
        trainingInProgress.selectedComponent.supersets.length - 1;

      if (isLastSuperset) return;

      const nextSuperset =
        trainingInProgress.selectedComponent.supersets[supersetIndex + 1];

      if (!nextSuperset) return;

      setTrainingInProgress((prev) => ({
        ...prev!,
        supersetIndex: supersetIndex + 1,
      }));
      setSelectedExercise(nextSuperset.exercises[0]);
      setSetIndex(0);
      setSupersetIndex(supersetIndex + 1);

      return;
    }

    const currentExerciseIndex = exercisesInCurrentSuperset.findIndex(
      (ex) => ex.id === exercise.id
    );

    if (currentExerciseIndex === -1) return;

    let j = 0;

    for (
      let i = currentExerciseIndex + 1;
      j < exercisesInCurrentSuperset.length;
      i++
    ) {
      j++;

      if (i >= exercisesInCurrentSuperset.length)
        i -= exercisesInCurrentSuperset.length;

      const currentExercise = exercisesInCurrentSuperset[i];

      if (!currentExercise) continue;

      const exerciseSetTracking =
        trainingInProgress.exerciseSetTrackingState.find(
          (s) => s.exerciseId === currentExercise.id
        );

      if (!exerciseSetTracking) continue;

      const hasCompletedAllSets =
        exerciseSetTracking.completedSetNumbers.length >=
        currentExercise.sets.length;

      if (hasCompletedAllSets) continue;

      let hasAdvanced = false;

      currentExercise.sets.forEach((set) => {
        if (hasAdvanced) return;

        if (!exerciseSetTracking.completedSetNumbers.includes(set.setNumber)) {
          hasAdvanced = true;

          setSelectedExercise(currentExercise);
          setSetIndex(set.setNumber - 1);
        }
      });

      if (hasAdvanced) return;
    }
  };

  return (
    <Checkbox
      icon={
        <CheckBoxOutlineBlank
          sx={{
            color: theme.palette.primary.main,
            fontSize: small ? 14 : undefined,
          }}
        />
      }
      checkedIcon={
        <CheckBoxIcon
          sx={{
            color: theme.palette.primary.main,
            fontSize: small ? 14 : undefined,
          }}
        />
      }
      size="small"
      checked={
        setIndex !== undefined &&
        isExerciseSetCompleted(
          { exerciseId: exercise.id },
          setIndex + 1,
          trainingInProgress.exerciseSetTrackingState
        )
      }
      sx={{
        zIndex: 10,
        '&.MuiCheckbox-root': {
          px: 0,
        },
        p: 0,
        mt: applyTopMargin ? 3.5 : undefined,
      }}
      onChange={async (e) => {
        if (setIndex === undefined) return;

        const isCompleted = e.target.checked;
        if (isCompleted) {
          await finishSet({
            exercise,
            setIndex,
            trainingInProgress,
            setTrainingInProgress,
            handleUpsertSet,
          });

          handleAdvanceInSuperset();
        } else {
          unmarkExerciseSetAsCompleted(
            { exerciseId: exercise.id },
            setIndex + 1,
            trainingInProgress.exerciseSetTrackingState,
            setTrainingInProgress
          );
        }
      }}
    />
  );
}
