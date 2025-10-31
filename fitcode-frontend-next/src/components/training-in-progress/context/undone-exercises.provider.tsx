import { createContext, useContext, useEffect, useState } from 'react';

import { useTrainingInProgressUtils } from './training-in.progress-utils.provider';
import type { TrainingExerciseExtended } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useTraining } from '@/store/training.provider';

export interface IUndoneExercisesCtx {
  undoneExercises: TrainingExerciseExtended[];
  setUndoneExercises: SetState<TrainingExerciseExtended[]>;
}

const UndoneExercisesContext = createContext<IUndoneExercisesCtx | null>(null);

export const useUndoneExercises = () => useContext(UndoneExercisesContext)!;

export function UndoneExercisesProvider({ children }: React.PropsWithChildren) {
  const { trainingInProgress } = useTraining();
  const { setShowUndoneSetsError } = useTrainingInProgressUtils();

  const [undoneExercises, setUndoneExercises] = useState<
    TrainingExerciseExtended[]
  >([]);

  useEffect(() => {
    if (!undoneExercises.length) {
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

  const value: IUndoneExercisesCtx = { undoneExercises, setUndoneExercises };
  return (
    <UndoneExercisesContext.Provider value={value}>
      {children}
    </UndoneExercisesContext.Provider>
  );
}
