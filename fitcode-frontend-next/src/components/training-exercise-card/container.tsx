'use client';

import { Box } from '@mui/material';

import TrainingExerciseChart from './chart';
import TrainingExerciseCard from './training-exercise-card';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useSupersets } from '@/store/supersets.provider';

export interface TrainingExerciseCardContainerProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  onAthleteView?: boolean;
}

export default function TrainingExerciseCardContainer(
  props: TrainingExerciseCardContainerProps
) {
  const { supersetIndex, exercise, onAthleteView } = props;
  const { selectedExercise } = useSupersets();

  return (
    <Box position="relative">
      {exercise.id === selectedExercise?.id ? (
        <TrainingExerciseChart
          supersetIndex={supersetIndex}
          exercise={exercise}
          onAthleteView={onAthleteView}
        />
      ) : (
        <TrainingExerciseCard
          supersetIndex={supersetIndex}
          exercise={exercise}
        />
      )}
    </Box>
  );
}
