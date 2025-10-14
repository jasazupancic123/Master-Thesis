import { createContext, useContext, useEffect, useState } from 'react';

import { useTrainingInProgressUtils } from './training-in.progress-utils.provider';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useTraining } from '@/store/training.provider';

interface UndoneExercisesContextProps {
  undoneExercises: TrainingExercise[];
  setUndoneExercises: SetState<TrainingExercise[]>;
}

const UndoneExercisesContext =
  createContext<UndoneExercisesContextProps | null>(null);

export const useUndoneExercises = () => useContext(UndoneExercisesContext)!;

export type UseUndoneExercisesReturnType = ReturnType<
  typeof useUndoneExercises
>;

export function UndoneExercisesProvider(props: ChildrenProps) {
  const { children } = props;

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

  const value: UndoneExercisesContextProps = {
    undoneExercises,
    setUndoneExercises,
  };

  return (
    <UndoneExercisesContext.Provider value={value}>
      {children}
    </UndoneExercisesContext.Provider>
  );
}
