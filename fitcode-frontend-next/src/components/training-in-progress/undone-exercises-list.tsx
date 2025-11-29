import { Box, Typography } from '@mui/material';

import { useUndoneExercises } from './context/undone-exercises.provider';
import UndoneExerciseSet from '@/components/training-in-progress/undone-exercise-set';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';

export default function UndoneExercisesList() {
  const { activeTraining } = useMain();
  const { undoneExercises } = useUndoneExercises();
  const { trainingInProgress } = useTrainings();

  const { supersetIndex } = useTrainingInProgress();

  if (!trainingInProgress) return null;

  const selectedSuperset = trainingInProgress.supersets[supersetIndex!];

  if (!selectedSuperset || supersetIndex === undefined) return null;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
      sx={{ overflowY: 'auto' }}
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
              const isSetDone = ExerciseSetService.isSetCompleted(
                {
                  trainingId: trainingInProgress.training.id,
                  componentId: trainingInProgress.selectedComponent.id,
                  exerciseId: exercise.id,
                  supersetIndex: supersetIndex,
                  setIndex: i,
                },
                activeTraining?.workloads || []
              );

              if (isSetDone) return null;

              setCounter++;

              return (
                <UndoneExerciseSet
                  key={i}
                  setIndex={i}
                  showOptions={setCounter === 1}
                  set={set}
                  exercise={exercise}
                  selectedSuperset={selectedSuperset!}
                  setSelectedSuperset={() => {}}
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
