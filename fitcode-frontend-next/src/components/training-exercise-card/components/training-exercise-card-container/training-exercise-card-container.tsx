'use client';

import { Box } from '@mui/material';
import TrainingExerciseCard from '../../training-exercise-card';
import TrainingExerciseSelected from '../training-exercise-selected/training-exercise-selected';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useSupersets } from '@/store/supersets.provider';

export interface TrainingExerciseCardContainerProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  onAthleteView?: boolean;
  superior?: { row: boolean; column: boolean; all: boolean };
}

export default function TrainingExerciseCardContainer(
  props: TrainingExerciseCardContainerProps
) {
  const { supersetIndex, exercise, superior, onAthleteView } = props;

  const { selectedExercise } = useSupersets();

  return (
    <Box position="relative">
      {exercise.id === selectedExercise?.id ? (
        <TrainingExerciseSelected
          supersetIndex={supersetIndex}
          exercise={exercise}
          onAthleteView={onAthleteView}
          superior={superior}
        />
      ) : (
        <TrainingExerciseCard
          supersetIndex={supersetIndex}
          exercise={exercise}
          superior={superior}
        />
      )}
    </Box>
  );
}
