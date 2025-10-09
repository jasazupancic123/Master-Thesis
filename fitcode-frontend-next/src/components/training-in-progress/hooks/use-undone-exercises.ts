import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useEffect, useState } from 'react';
import useTrainingInProgressUtils from './use-utils';
import { useTraining } from '@/store/training.provider';

export type UseUndoneExercisesReturnType = ReturnType<
  typeof useTrainingInProgressUndoneExercises
>;

export default function useTrainingInProgressUndoneExercises() {
  const [undoneExercises, setUndoneExercises] = useState<TrainingExercise[]>(
    []
  );

  const { trainingInProgress } = useTraining();

  const { setShowUndoneSetsWarning, setShowUndoneSetsError } =
    useTrainingInProgressUtils();

  useEffect(() => {
    if (!undoneExercises.length) {
      setShowUndoneSetsWarning(false);
      setShowUndoneSetsError(false);
      return;
    }

    if (!trainingInProgress) return;

    undoneExercises.forEach((undoneExercise) => {
      const setTrackingState = trainingInProgress.exerciseSetTrackingState.find(
        (state) => state.exerciseId === undoneExercise.id
      );

      if (!setTrackingState) return;

      const hasUndoneSets =
        setTrackingState.completedSetNumbers.length <
        undoneExercise.sets.length;

      if (!hasUndoneSets) {
        setUndoneExercises((prev) => {
          return prev.filter((e) => e.id !== undoneExercise.id);
        });
      }
    });
  }, [undoneExercises, trainingInProgress]);

  return { undoneExercises, setUndoneExercises };
}
