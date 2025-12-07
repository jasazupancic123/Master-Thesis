import { Box, Typography, useTheme } from '@mui/material';

import { finishSet } from './actions/actions-exercise-set';
import { handleAdvanceInSuperset } from './actions/actions-superset';
import { useTrainingInProgressUtils } from './context/training-in.progress-utils.provider';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';

interface Props {
  exercise: TrainingExercise;
  supersetIndex: number;
  setIndex: number;
}

export default function TrainingExerciseSetDoneCheckbox(props: Props) {
  const theme = useTheme();

  const { user } = useAuthenticatedAuth();
  const mainContext = useMain();
  const trainingContext = useTrainings();
  const trainingInProgressContext = useTrainingInProgress();

  const trainingInProgressUtilsContext = useTrainingInProgressUtils();

  const { trainingInProgress, setTrainingInProgress } = trainingContext;

  const { handleUpsertSet, workloads, setWorkloads } =
    trainingInProgressContext;

  const { exercise, setIndex, supersetIndex } = props;

  if (!exercise || !trainingInProgress) return null;

  const foundWorkload =
    supersetIndex !== null
      ? workloads.find(
          (w) =>
            w.userId === trainingInProgress.userId &&
            w.exerciseId === exercise.id &&
            w.setNumber === setIndex + 1 &&
            w.componentId === trainingInProgress.componentId &&
            w.trainingId === trainingInProgress.training.id &&
            w.supersetIndex === supersetIndex
        )
      : undefined;

  const isSetCompleted = foundWorkload && foundWorkload.id !== undefined;

  return (
    <Box
      sx={{
        p: 0.1,
        borderRadius: 2,
        cursor: 'pointer',
        border: isSetCompleted
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
          backgroundColor: isSetCompleted
            ? theme.palette.primary.main
            : theme.palette.background.default,
          border: isSetCompleted
            ? `1px solid ${theme.palette.primary.main}`
            : `1px solid transparent`,
        }}
        onClick={async () => {
          if (setIndex === undefined) return;

          const recordedSet = trainingInProgress.recordedSets.find(
            (s) =>
              s.exerciseId === exercise.id &&
              s.supersetIndex === supersetIndex &&
              s.setIndex === setIndex
          );

          if (!isSetCompleted) {
            await finishSet({
              userId: user.uid,
              exercise,
              supersetIndex,
              setIndex,
              trainingInProgress,
              setTrainingInProgress,
              workloadInput: {},
              imagesL: recordedSet?.imagesL || [],
              imagesR: recordedSet?.imagesR || [],
              handleUpsertSet,
              workloads,
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
            const newWorkloads = workloads.filter(
              (w) => w.id !== foundWorkload?.id
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (foundWorkload as any).id = undefined; // force update - remove id to make it "un-posted"

            newWorkloads.push(foundWorkload);

            setWorkloads(newWorkloads);
          }
        }}
      >
        <Typography
          fontSize={10}
          fontWeight={500}
          textAlign="center"
          sx={{
            color: isSetCompleted
              ? theme.palette.text.secondary
              : theme.palette.text.primary,
          }}
        >
          {isSetCompleted ? 'Done' : 'Complete'}
        </Typography>
      </Box>
    </Box>
  );
}
