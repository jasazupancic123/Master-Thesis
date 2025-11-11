import { Box, Typography, useTheme } from '@mui/material';

import {
  finishSet,
  isExerciseSetCompleted,
  unmarkExerciseSetAsCompleted,
} from './actions/actions-exercise-set';
import { handleAdvanceInSuperset } from './actions/actions-superset';
import type {
  TrainingExercise,
  TrainingExerciseRecording,
} from '@/core/training/type/training-exercise.type';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

interface TrainingExerciseSetDoneCheckboxProps {
  exercise: TrainingExercise | TrainingExerciseRecording;
  setIndex: number;
}

export default function TrainingExerciseSetDoneCheckbox(
  props: TrainingExerciseSetDoneCheckboxProps
) {
  const theme = useTheme();

  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();

  const { trainingInProgress, setTrainingInProgress } = trainingContext;

  const { handleUpsertSet } = trainingInProgressContext;

  const { exercise, setIndex } = props;

  if (!exercise || !trainingInProgress) {
    return null;
  }

  const isExerciseRecording = (
    exercise: TrainingExercise | TrainingExerciseRecording
  ): exercise is TrainingExerciseRecording => {
    return (exercise as TrainingExerciseRecording).recordedSets !== undefined;
  };

  const trainingExerciseRecording = isExerciseRecording(exercise)
    ? exercise.recordedSets?.find((set) => set.setIndex === setIndex)
    : undefined;

  const setTrackingState = trainingInProgress.exerciseSetTrackingState.find(
    (state) => state.exerciseId === exercise.id
  );

  const foundCompletedSet = setTrackingState?.completedSetNumbers.find(
    (completedSet) => completedSet.setNumber === setIndex + 1
  );

  const isRecorded =
    trainingExerciseRecording &&
    foundCompletedSet &&
    !foundCompletedSet.isBeenSetToCompleted;

  const isCompleted =
    setIndex !== undefined &&
    isExerciseSetCompleted(
      { exerciseId: exercise.id },
      setIndex + 1,
      trainingInProgress.exerciseSetTrackingState
    );

  return (
    <Box
      sx={{
        p: 0.1,
        borderRadius: '50%',
        cursor: 'pointer',
        border: isRecorded
          ? `1px solid ${theme.palette.secondary.main}`
          : isCompleted
            ? `1px solid ${theme.palette.primary.main}`
            : `1px solid ${theme.palette.text.primary}`,
        mr: 3,
      }}
    >
      <Box
        width={38}
        height={38}
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          borderRadius: '50%',
          backgroundColor: isRecorded
            ? theme.palette.secondary.main
            : isCompleted
              ? theme.palette.primary.main
              : theme.palette.background.default,
          border: isRecorded
            ? `1px solid ${theme.palette.secondary.main}`
            : isCompleted
              ? `1px solid ${theme.palette.primary.main}`
              : `1px solid transparent`,
        }}
        onClick={async () => {
          if (setIndex === undefined) return;

          if (isRecorded) {
            // if it's recorded, then it was already saved, just advance
            setTrainingInProgress((prev) =>
              !prev
                ? prev
                : {
                    ...prev,
                    exerciseSetTrackingState: prev.exerciseSetTrackingState.map(
                      (state) => {
                        if (state.exerciseId !== exercise.id) return state;
                        return {
                          ...state,
                          completedSetNumbers: state.completedSetNumbers.map(
                            (completedSet) => {
                              if (completedSet.setNumber !== setIndex + 1)
                                return completedSet;
                              return {
                                ...completedSet,
                                isBeenSetToCompleted: true,
                              };
                            }
                          ),
                        };
                      }
                    ),
                  }
            );

            handleAdvanceInSuperset({
              useTraining: { ...trainingContext, trainingInProgress },
              useTrainingInProgress: trainingInProgressContext,
            });
            return;
          }

          if (!isCompleted) {
            await finishSet({
              exercise,
              setIndex,
              trainingInProgress,
              setTrainingInProgress,
              handleUpsertSet,
            });

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
      >
        <Typography
          fontSize={10}
          fontWeight={500}
          textAlign="center"
          sx={{
            color:
              isCompleted || isRecorded
                ? theme.palette.text.secondary
                : theme.palette.text.primary,
          }}
        >
          {isRecorded ? 'Saved' : isCompleted ? 'Done' : 'Not\nDone'}
        </Typography>
      </Box>
    </Box>
  );
}
