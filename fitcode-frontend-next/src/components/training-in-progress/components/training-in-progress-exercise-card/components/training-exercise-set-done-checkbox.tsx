import { RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox, useTheme } from '@mui/material';

import {
  finishSet,
  isExerciseSetCompleted,
  unmarkExerciseSetAsCompleted,
} from '../actions/actions-exercise-set';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
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
    setSelectedSuperset,
  } = useTrainingInProgress();

  const { exercise, applyTopMargin, exerciseView, small, setIndex } = props;

  if (!exercise || !trainingInProgress) {
    return null;
  }

  const handleAdvanceInSuperset = () => {
    // go to next exercise

    if (!exerciseView || supersetIndex === undefined) return;

    const currentSuperset =
      trainingInProgress.selectedComponent.supersets[supersetIndex];

    if (!currentSuperset) return;

    const isLastExercise =
      currentSuperset.exercises.findIndex((ex) => ex.id === exercise.id) ===
      currentSuperset.exercises.length - 1;

    if (isLastExercise && setIndex === exercise.sets.length - 1) {
      // move to next superset

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
      setSelectedSuperset(nextSuperset);
      setSupersetIndex(supersetIndex + 1);

      return;
    } else if (isLastExercise) {
      // move to next set in first exercise of superset
      const firstExercise = currentSuperset.exercises[0];
      if (!firstExercise) return;

      if (firstExercise.sets.length < setIndex + 2) return;

      setSelectedExercise(firstExercise);
      setSetIndex((prev) => (prev !== undefined ? prev + 1 : 0));

      return;
    } else {
      // move to next exercise
      const currentExerciseSupersetIndex = currentSuperset.exercises.findIndex(
        (ex) => ex.id === exercise.id
      );

      const nextExercise =
        currentExerciseSupersetIndex !== -1
          ? currentSuperset.exercises[currentExerciseSupersetIndex + 1]
          : undefined;

      if (!nextExercise) return;

      setSelectedExercise(nextExercise);
    }
  };

  return (
    <Checkbox
      icon={
        <RadioButtonUnchecked
          sx={{
            color: theme.palette.primary.main,
            fontSize: small ? 14 : undefined,
          }}
        />
      }
      checkedIcon={
        <RadioButtonChecked
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
