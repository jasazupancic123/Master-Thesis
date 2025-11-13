import { Box, Typography, useTheme } from '@mui/material';

import {
  finishSet,
  unmarkExerciseSetAsCompleted,
} from './actions/actions-exercise-set';
import { handleAdvanceInSuperset } from './actions/actions-superset';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import { useMain } from '@/store/main.provider';
import { useEffect, useState } from 'react';

interface Props {
  exercise: TrainingExercise;
  supersetIndex: number;
  setIndex: number;
}

export default function TrainingExerciseSetDoneCheckbox(props: Props) {
  const theme = useTheme();

  const mainContext = useMain();
  const { activeTraining, setActiveTraining } = mainContext;
  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();

  const { trainingInProgress, setTrainingInProgress } = trainingContext;

  const { currentAiRecordedWorkload, handleUpsertSet } =
    trainingInProgressContext;

  const { exercise, setIndex, supersetIndex } = props;

  if (!exercise || !trainingInProgress) {
    return null;
  }

  const isRecorded =
    currentAiRecordedWorkload &&
    currentAiRecordedWorkload.componentId ===
      trainingInProgress.selectedComponent.id &&
    currentAiRecordedWorkload.exerciseId === exercise.id &&
    currentAiRecordedWorkload.supersetIndex === supersetIndex &&
    currentAiRecordedWorkload.setNumber === setIndex + 1;

  const [isCompleted, setIsCompleted] = useState<boolean>(
    ExerciseSetService.isSetCompleted(
      {
        exerciseId: exercise.id,
        componentId: trainingInProgress.selectedComponent.id,
        supersetIndex,
        setIndex,
      },
      activeTraining.training?.workloads || []
    )
  );

  useEffect(() => {
    const completed = ExerciseSetService.isSetCompleted(
      {
        exerciseId: exercise.id,
        componentId: trainingInProgress.selectedComponent.id,
        supersetIndex,
        setIndex,
      },
      activeTraining.training?.workloads || []
    );

    setIsCompleted(completed);
  }, [activeTraining, exercise, supersetIndex, setIndex]);

  return (
    <Box
      sx={{
        p: 0.1,
        borderRadius: 2,
        cursor: 'pointer',
        border: isRecorded
          ? `1px solid ${theme.palette.text.primary}`
          : isCompleted
            ? `1px solid ${theme.palette.primary.main}`
            : `1px solid ${theme.palette.text.primary}`,
        mr: 5,
        my: 'auto',
      }}
    >
      <Box
        width={50}
        height={50}
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          borderRadius: 2,
          backgroundColor: isRecorded
            ? theme.palette.background.default
            : isCompleted
              ? theme.palette.primary.main
              : theme.palette.background.default,
          border: isRecorded
            ? `1px solid transparent`
            : isCompleted
              ? `1px solid ${theme.palette.primary.main}`
              : `1px solid transparent`,
        }}
        onClick={async () => {
          if (setIndex === undefined) return;

          if (isRecorded) {
            // if it's recorded, then it was already saved, just advance
            handleAdvanceInSuperset({
              useMain: mainContext,
              useTraining: { ...trainingContext, trainingInProgress },
              useTrainingInProgress: trainingInProgressContext,
            });
            return;
          }

          if (!isCompleted) {
            await finishSet({
              exercise,
              supersetIndex,
              setIndex,
              trainingInProgress,
              setTrainingInProgress,
              handleUpsertSet,
            });

            handleAdvanceInSuperset(
              {
                useMain: mainContext,
                useTraining: { ...trainingContext, trainingInProgress },
                useTrainingInProgress: trainingInProgressContext,
              },
              true
            );
          } else {
            unmarkExerciseSetAsCompleted(
              { exerciseId: exercise.id, setIndex, supersetIndex },
              setActiveTraining
            );
          }
        }}
      >
        <Typography
          fontSize={10}
          fontWeight={500}
          textAlign="center"
          sx={{
            color: isRecorded
              ? theme.palette.text.primary
              : isCompleted
                ? theme.palette.text.secondary
                : theme.palette.text.primary,
          }}
        >
          {isRecorded ? 'Confirm' : isCompleted ? 'Done' : 'Confirm'}
        </Typography>
      </Box>
    </Box>
  );
}
