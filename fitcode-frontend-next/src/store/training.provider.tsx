'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { useAuthenticatedAuth } from './auth.provider';
import { TrackingMethod } from '@/common/enum/tracking-method.enum';
import type { ExerciseOrTraining } from '@/common/type/exercise-or-training.type';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';

interface TrainingContextType extends TrainingProviderProps {
  clearTrainingState: () => void;
  trainingInProgress: TrainingInProgress | null;
  setTrainingInProgress: SetState<TrainingInProgress | null>;
  view: ExerciseOrTraining;
  setView: SetState<ExerciseOrTraining>;
  isLoaded: boolean;
  updateTrainingInProgress: (
    exercise: TrainingExercise,
    supersetIndex: number
  ) => void;
}

export interface TrainingProviderProps {
  plannedTrainings: Training[];
  completedTrainings: Training[];
}

const TrainingContext = createContext<TrainingContextType | undefined>(
  undefined
);

export const TrainingProvider = (
  props: TrainingProviderProps & ChildrenProps
) => {
  const { children, plannedTrainings, completedTrainings } = props;

  const STORED_TRAINING_IN_PROGRESS = 'fitcodeTrainingInProgress';
  const [trainingInProgress, setTrainingInProgress] =
    useState<TrainingInProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState<ExerciseOrTraining>(
    ExerciseTrainingView.ExerciseView
  );

  const { user } = useAuthenticatedAuth();

  useEffect(() => {
    const storedTrainingInProgress = localStorage.getItem(
      STORED_TRAINING_IN_PROGRESS
    );

    if (storedTrainingInProgress) {
      const parsedTrainingInProgress = JSON.parse(
        storedTrainingInProgress
      ) as TrainingInProgress;

      if (parsedTrainingInProgress.userId !== user?.uid) {
        clearTrainingState();
        setIsLoaded(true);
        return;
      }

      setTrainingInProgress({ ...parsedTrainingInProgress });
    }

    setIsLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!trainingInProgress) return;

    if (trainingInProgress.startOfTraining) {
      localStorage.setItem(
        STORED_TRAINING_IN_PROGRESS,
        JSON.stringify(trainingInProgress)
      );
    }
  }, [trainingInProgress, isLoaded]);

  const clearTrainingState = () => {
    setTrainingInProgress(null);
    setView(ExerciseTrainingView.ExerciseView);
    localStorage.removeItem(STORED_TRAINING_IN_PROGRESS);
  };

  const updateTrainingInProgress = (
    exercise: TrainingExercise,
    supersetIndex: number
  ) => {
    if (!trainingInProgress) return;

    setTrainingInProgress({
      ...trainingInProgress,
      selectedComponent: {
        ...trainingInProgress.selectedComponent,
        supersets: trainingInProgress.selectedComponent.supersets.map(
          (superset) => ({
            ...superset,
            exercises: superset.exercises.map((ex) =>
              ex.id === exercise.id ? exercise : ex
            ),
          })
        ),
      },
      supersets: trainingInProgress.supersets.map((superset, index) =>
        index === supersetIndex
          ? {
              ...superset,
              exercises: superset.exercises.map((ex) =>
                ex.id === exercise.id ? exercise : ex
              ),
            }
          : superset
      ),
    });
  };

  return (
    <TrainingContext.Provider
      value={{
        plannedTrainings,
        completedTrainings,
        clearTrainingState,
        trainingInProgress,
        setTrainingInProgress,
        view,
        setView,
        isLoaded,
        updateTrainingInProgress,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = () => useContext(TrainingContext)!;
