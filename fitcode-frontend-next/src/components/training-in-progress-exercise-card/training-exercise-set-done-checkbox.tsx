import { RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox, useTheme } from '@mui/material';
import toast from 'react-hot-toast';

import {
  isExerciseSetCompleted,
  markExerciseSetAsCompleted,
  unmarkExerciseSetAsCompleted,
} from './state';
import { TrainingService } from '@/controller/training/training.service';
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

  const handleMoveToNextSet = () => {
    if (!exerciseView || supersetIndex === undefined) return;

    const nextSetIndex = setIndex + 1;

    if (nextSetIndex >= exercise.sets.length) {
      const currentSuperset =
        trainingInProgress.selectedComponent.supersets[supersetIndex];

      if (!currentSuperset) return;

      const isLastExercise =
        currentSuperset.exercises.findIndex((ex) => ex.id === exercise.id) ===
        currentSuperset.exercises.length - 1;

      if (isLastExercise) {
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
      }

      const currentExerciseSupersetIndex = currentSuperset.exercises.findIndex(
        (ex) => ex.id === exercise.id
      );

      const nextExercise =
        currentExerciseSupersetIndex !== -1
          ? currentSuperset.exercises[currentExerciseSupersetIndex + 1]
          : undefined;

      if (!nextExercise) return;

      setSelectedExercise(nextExercise);
      setSetIndex(0);
      return;
    }

    setSetIndex(nextSetIndex);
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
          const set = TrainingService.exerciseSetToCompleteSet(
            exercise.sets[setIndex]
          );

          markExerciseSetAsCompleted(
            { exerciseId: exercise.id },
            setIndex + 1,
            trainingInProgress.exerciseSetTrackingState,
            setTrainingInProgress
          );

          const supersetIndex =
            trainingInProgress.selectedComponent.supersets.findIndex(
              (superset) =>
                superset.exercises.find((ex) => ex.id === exercise.id)
            );

          if (supersetIndex === -1) {
            toast.error('Superset not found');
            return;
          }

          await handleUpsertSet(set, {
            exerciseId: exercise.id,
            setIndex,
            supersetIndex,
          });

          handleMoveToNextSet();
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
