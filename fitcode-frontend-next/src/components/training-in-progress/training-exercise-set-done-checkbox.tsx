import { Box, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

import {
  finishSet,
  unmarkExerciseSetAsCompleted,
} from './actions/actions-exercise-set';
import { handleAdvanceInSuperset } from './actions/actions-superset';
import { useTrainingInProgressUtils } from './context/training-in.progress-utils.provider';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';

interface Props {
  exercise: TrainingExercise;
  supersetIndex: number;
  setIndex: number;
}

export default function TrainingExerciseSetDoneCheckbox(props: Props) {
  const theme = useTheme();

  const { user } = useAuthenticatedAuth();
  const mainContext = useMain();
  const { activeTraining, setActiveTraining } = mainContext;
  const trainingContext = useTrainings();
  const trainingInProgressContext = useTrainingInProgress();

  const trainingInProgressUtilsContext = useTrainingInProgressUtils();

  const { trainingInProgress, setTrainingInProgress } = trainingContext;

  const { currentAiRecordedWorkload, handleUpsertSet } =
    trainingInProgressContext;

  const { exercise, setIndex, supersetIndex } = props;

  const isRecorded =
    currentAiRecordedWorkload &&
    trainingInProgress &&
    currentAiRecordedWorkload.componentId ===
      trainingInProgress.selectedComponent.id &&
    currentAiRecordedWorkload.exerciseId === exercise.id &&
    currentAiRecordedWorkload.supersetIndex === supersetIndex &&
    currentAiRecordedWorkload.setNumber === setIndex + 1;

  useEffect(() => {
    if (!trainingInProgress) return;

    const completed = ExerciseSetService.isSetCompleted(
      {
        trainingId: trainingInProgress.training.id,
        componentId: trainingInProgress.selectedComponent.id,
        exerciseId: exercise.id,
        supersetIndex,
        setIndex,
      },
      activeTraining?.workloads || []
    );

    setIsCompleted(completed);
  }, [activeTraining, exercise, supersetIndex, setIndex]);

  const [isCompleted, setIsCompleted] = useState<boolean>(
    trainingInProgress
      ? ExerciseSetService.isSetCompleted(
          {
            trainingId: trainingInProgress.training.id,
            componentId: trainingInProgress.selectedComponent.id,
            exerciseId: exercise.id,
            supersetIndex,
            setIndex,
          },
          activeTraining?.workloads || []
        )
      : false
  );

  if (!exercise || !trainingInProgress) {
    return null;
  }

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
              useTrainingInProgressUtils: trainingInProgressUtilsContext,
            });
            return;
          }

          const recordedSet = trainingInProgress.recordedSets.find(
            (s) =>
              s.exerciseId === exercise.id &&
              s.supersetIndex === supersetIndex &&
              s.setIndex === setIndex
          );

          if (!isCompleted) {
            await finishSet({
              userId: user.uid,
              exercise,
              supersetIndex,
              setIndex,
              trainingInProgress,
              setTrainingInProgress,
              imagesL: recordedSet?.imagesL || [],
              imagesR: recordedSet?.imagesR || [],
              handleUpsertSet,
              workloads: activeTraining?.workloads || [],
            });

            handleAdvanceInSuperset(
              {
                useMain: mainContext,
                useTraining: { ...trainingContext, trainingInProgress },
                useTrainingInProgress: trainingInProgressContext,
                useTrainingInProgressUtils: trainingInProgressUtilsContext,
              },
              true
            );
          } else {
            unmarkExerciseSetAsCompleted(
              {
                exerciseId: exercise.id,
                setIndex,
                supersetIndex,
              },
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
