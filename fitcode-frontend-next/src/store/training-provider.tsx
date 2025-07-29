'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { SetState } from '@/common/type/state.type';
import {
  ExerciseOrTraining,
  ExerciseTrainingView,
} from '@/common/type/exercise-or-training.type';
import { Training } from '@/controller/training/type/training.type';
import { ChildrenProps } from '@/common/type/props.type';
import { TrainingController } from '@/controller/training/training.controller';

interface TrainingContextType extends TrainingProviderProps {
  clearTrainingState: () => void;
  trainingInProgress: TrainingInProgress | null;
  setTrainingInProgress: SetState<TrainingInProgress | null>;
  view: ExerciseOrTraining;
  setView: SetState<ExerciseOrTraining>;
  isLoaded: boolean;
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

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

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
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = () => useContext(TrainingContext)!;
