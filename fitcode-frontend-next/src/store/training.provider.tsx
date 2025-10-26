'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { useAuthenticatedAuth } from './auth.provider';
import { ExerciseTrainingView } from '@/core/training/enum/exercise-training-view.enum';
import type { Training } from '@/core/training/type/training.type';
import type {
  TrainingExercise,
  TrainingExerciseRecording,
} from '@/core/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import { lib } from '@/lib';
import { type SetState } from '@/lib/common/type/state.type';

type ExerciseOrTraining =
  (typeof ExerciseTrainingView)[keyof typeof ExerciseTrainingView];

export interface TrainingProviderProps {
  trainings: Training[];
  reports: TrainingReport[];
  refetchTraining: (trainingId: string) => Promise<void>;
}

interface ITrainingContext extends TrainingProviderProps {
  clearTrainingState: () => Promise<void>;
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

const TrainingContext = createContext<ITrainingContext | undefined>(undefined);

export type ITrainingContextDefined = Omit<
  ReturnType<typeof useTraining>,
  'trainingInProgress'
> & {
  trainingInProgress: TrainingInProgress;
};

export const TrainingProvider = (
  props: TrainingProviderProps & React.PropsWithChildren
) => {
  const { children, trainings, reports, refetchTraining } = props;

  const STORED_TRAINING_IN_PROGRESS = 'blindoffTrainingInProgress';
  const [trainingInProgress, setTrainingInProgress] =
    useState<TrainingInProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState<ExerciseOrTraining>(
    ExerciseTrainingView.ExerciseView
  );

  const { user } = useAuthenticatedAuth();

  useEffect(() => {
    // const storedTrainingInProgress = localStorage.getItem(
    //   STORED_TRAINING_IN_PROGRESS
    // );

    const setupTrainingInProgress = async () => {
      const storedTrainingInProgress = await lib.common.indexedDb.items.get(
        STORED_TRAINING_IN_PROGRESS
      );

      if (storedTrainingInProgress) {
        const parsedTrainingInProgress = JSON.parse(
          storedTrainingInProgress.payload
        ) as TrainingInProgress;

        if (parsedTrainingInProgress.userId !== user?.uid) {
          await clearTrainingState();
          setIsLoaded(true);
          return;
        }

        setTrainingInProgress({ ...parsedTrainingInProgress });
      }

      setIsLoaded(true);
    };

    setupTrainingInProgress();
  }, [user]);

  useEffect(() => {
    if (!trainingInProgress) return;

    const storeTrainingInProgress = async () => {
      if (trainingInProgress.startOfTraining) {
        // localStorage.setItem(
        //   STORED_TRAINING_IN_PROGRESS,
        //   JSON.stringify(trainingInProgress)
        // );

        // console.log('storing training in progress', trainingInProgress);

        await lib.common.indexedDb.items.put({
          id: STORED_TRAINING_IN_PROGRESS,
          payload: JSON.stringify(trainingInProgress),
          updatedAt: Date.now(),
        });
      }
    };

    storeTrainingInProgress();
  }, [trainingInProgress, isLoaded]);

  const clearTrainingState = async () => {
    setTrainingInProgress(null);
    setView(ExerciseTrainingView.ExerciseView);
    // localStorage.removeItem(STORED_TRAINING_IN_PROGRESS);
    await lib.common.indexedDb.items.delete(STORED_TRAINING_IN_PROGRESS);
  };

  const updateTrainingInProgress = (
    exercise: TrainingExerciseRecording,
    supersetIndex: number
  ) => {
    if (!trainingInProgress) return;

    const newTrainingInProgress = {
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
    };

    setTrainingInProgress(newTrainingInProgress);
  };

  return (
    <TrainingContext.Provider
      value={{
        trainings,
        reports,
        clearTrainingState,
        trainingInProgress,
        setTrainingInProgress,
        view,
        setView,
        isLoaded,
        updateTrainingInProgress,
        refetchTraining,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = () => useContext(TrainingContext)!;
