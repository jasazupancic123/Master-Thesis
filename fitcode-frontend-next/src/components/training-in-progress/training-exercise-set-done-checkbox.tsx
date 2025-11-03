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
import { handleAdvanceInSuperset } from './actions/actions-superset';

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

  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();

  const { trainingInProgress, setTrainingInProgress } = trainingContext;

  const { handleUpsertSet } = trainingInProgressContext;

  const { exercise, applyTopMargin, exerciseView, small, setIndex } = props;

  if (!exercise || !trainingInProgress) {
    return null;
  }

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

          if (exerciseView)
            handleAdvanceInSuperset({
              useTraining: { ...trainingContext, trainingInProgress },
              useTrainingInProgress: trainingInProgressContext,
            });
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
