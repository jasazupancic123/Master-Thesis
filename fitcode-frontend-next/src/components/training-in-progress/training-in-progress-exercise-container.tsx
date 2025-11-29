import { Box } from '@mui/material';
import { useRef } from 'react';

import TrainingInProgressExerciseCard from './training-in-progress-exercise-card';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';

export default function TrainingInProgressExerciseContainer() {
  const traininContext = useTrainings();
  const trainingInProgressContext = useTrainingInProgress();

  const { trainingInProgress } = traininContext;

  const { selectedExercise } = trainingInProgressContext;

  const boxRef = useRef<HTMLDivElement | null>(null);

  if (!trainingInProgress) return null;

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box
        ref={boxRef}
        width="100%"
        flexGrow={1} // Ensures it expands
        display="flex"
        flexDirection="column"
        gap={3}
      >
        {/* Training Exercise */}
        {selectedExercise && <TrainingInProgressExerciseCard />}
      </Box>
    </Box>
  );
}
