'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { useTrainingInProgressUtils } from './training-in.progress-utils.provider';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import type { TrainingExerciseExtended } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useTrainings } from '@/store/trainings.provider';

export interface IUndoneExercisesCtx {
  undoneExercises: TrainingExerciseExtended[];
  setUndoneExercises: SetState<TrainingExerciseExtended[]>;
}

const UndoneExercisesContext = createContext<IUndoneExercisesCtx | null>(null);

export const useUndoneExercises = () => useContext(UndoneExercisesContext)!;

export function UndoneExercisesProvider({ children }: React.PropsWithChildren) {
  const { activeTraining } = useMain();
  const { trainingInProgress } = useTrainings();
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
      const supersetIndex = trainingInProgress.supersets.findIndex((s) =>
        s.exercises.some((e) => e.id === undoneExercise.id)
      );

      const hasUndoneSets = ExerciseSetService.hasExerciseGotUndoneSets(
        undoneExercise,
        {
          trainingId: trainingInProgress.training.id,
          supersetIndex,
          componentId: trainingInProgress.selectedComponent.id,
        },
        activeTraining?.workloads || []
      );

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
