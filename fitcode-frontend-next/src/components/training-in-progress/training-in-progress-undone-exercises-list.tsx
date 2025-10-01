import { Box, Typography } from '@mui/material';

import TrainingInProgressExerciseSet from '../training-in-progress-exercise-set/training-in-progress-exercise-set';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

interface UndoneExercisesListProps {
  undoneExercises: TrainingExercise[];
}

export default function UndoneExercisesList(props: UndoneExercisesListProps) {
  const { undoneExercises } = props;

  const { trainingInProgress } = useTraining();

  const { selectedSuperset } = useTrainingInProgress();

  if (!trainingInProgress) return null;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
      sx={{
        overflowY: 'auto',
      }}
    >
      <Typography textAlign="center" fontSize={20} fontWeight={500}>
        Undone sets
      </Typography>
      {undoneExercises.map((exercise) => {
        let setCounter = 0;

        return (
          <Box width="100%" key={exercise.id}>
            <Typography textAlign="center">
              {exercise.exercise?.name}
            </Typography>
            {exercise.sets.map((set, i) => {
              const isSetDone =
                trainingInProgress.exerciseSetTrackingState.find(
                  (s) =>
                    s.exerciseId === exercise.id &&
                    s.completedSetNumbers.includes(set.setNumber)
                );

              if (isSetDone) return null;

              setCounter++;

              return (
                <TrainingInProgressExerciseSet
                  key={i}
                  setIndex={i}
                  showOptions={setCounter === 1}
                  set={set}
                  exercise={exercise}
                  selectedSuperset={selectedSuperset!}
                  setSelectedSuperset={() => {}}
                  isUnilateral={exercise.exercise?.isUnilateral || false}
                  showDoneCheckbox
                />
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
