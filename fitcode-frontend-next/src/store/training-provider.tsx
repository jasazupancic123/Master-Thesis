'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { AthleteTrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { SetState } from '@/common/type/state.type';
import {
  ExerciseOrTraining,
  ExerciseTrainingView,
} from '@/common/type/exercise-or-training.type';
import { Training } from '@/controller/training/type/training.type';
import { ChildrenProps } from '@/common/type/props.type';

interface TrainingContextType extends TrainingProviderProps {
  clearTrainingState: () => void;
  trainingInProgress: AthleteTrainingInProgress | null;
  setTrainingInProgress: SetState<AthleteTrainingInProgress | null>;
  view: ExerciseOrTraining;
  setView: SetState<ExerciseOrTraining>;
  isLoaded: boolean;
}

export interface TrainingProviderProps {
  trainings: Training[];
}

const TrainingContext = createContext<TrainingContextType | undefined>(
  undefined
);

export const TrainingProvider = (
  props: TrainingProviderProps & ChildrenProps
) => {
  const { children, trainings } = props;

  const STORED_TRAINING_IN_PROGRESS = 'fitcodeTrainingInProgress';
  const [trainingInProgress, setTrainingInProgress] =
    useState<AthleteTrainingInProgress | null>(null);
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
      ) as AthleteTrainingInProgress;
      if (parsedTrainingInProgress.userId !== user?.uid) {
        clearTrainingState();
        return;
      }
      setTrainingInProgress(parsedTrainingInProgress);
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
        trainings,
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
