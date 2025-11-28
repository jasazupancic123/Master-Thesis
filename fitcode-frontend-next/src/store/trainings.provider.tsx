'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { useAuthenticatedAuth } from './auth.provider';
import { useMain } from './main.provider';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { TrainingInProgressIndexDB } from '@/core/training/type/training-in-progress-indexdb';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import { lib } from '@/lib';
import { type SetState } from '@/lib/common/type/state.type';

export const TRAINING_IN_PROGRESS_STORAGE_KEY = 'blindoff_training_in_progress';

export interface TrainingsProviderProps {
  reports: TrainingReport[];
}

interface ITrainingsContext extends TrainingsProviderProps {
  clearTrainingState: () => Promise<void>;
  trainingInProgress: TrainingInProgress | null;
  setTrainingInProgress: SetState<TrainingInProgress | null>;
  isLoaded: boolean;
  updateTrainingInProgress: (
    exercise: TrainingExercise,
    supersetIndex: number
  ) => void;
}

const TrainingsContext = createContext<ITrainingsContext | undefined>(undefined);

export type ITrainingsContextDefined = Omit<
  ReturnType<typeof useTrainings>,
  'trainingInProgress'
> & {
  trainingInProgress: TrainingInProgress;
};

export const TrainingsProvider = (
  props: TrainingsProviderProps & React.PropsWithChildren
) => {
  const { activeTraining } = useMain();
  const { children, reports } = props;

  const [trainingInProgress, setTrainingInProgress] =
    useState<TrainingInProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { user } = useAuthenticatedAuth();

  const pathname = usePathname();

  const trainingId = pathname.split('/')[2];
  const componentId = pathname.split('/').pop() || '';

  const STORED_TRAINING_IN_PROGRESS =
    trainingId && componentId
      ? `${TRAINING_IN_PROGRESS_STORAGE_KEY}_${trainingId}_${componentId}`
      : TRAINING_IN_PROGRESS_STORAGE_KEY;

  useEffect(() => {
    const setupTrainingInProgress = async () => {
      if (!activeTraining || !user) {
        return;
      }

      const trainingId = pathname.split('/')[2];
      const componentId = pathname.split('/').pop() || '';

      if (!trainingId || !componentId) return;

      const component = activeTraining.components.find(
        (comp) => comp.id === componentId
      );

      if (!component) return;

      const storedTrainingInProgressObject =
        await lib.common.indexedDb.items.get(STORED_TRAINING_IN_PROGRESS); // LOAD FROM INDEX_DB

      const storedTrainingInProgress = storedTrainingInProgressObject
        ? JSON.parse(storedTrainingInProgressObject.payload)
        : (undefined as TrainingInProgressIndexDB | undefined);

      if (storedTrainingInProgress) {
        setTrainingInProgress({
          training: activeTraining,
          selectedComponent: component,
          userId: user.uid,
          supersets: component.supersets,
          startOfTraining: storedTrainingInProgress?.startOfTraining || null,
          recordedSets: storedTrainingInProgress?.recordedSets || [],
        } as TrainingInProgress);
      }

      setIsLoaded(true);
    };

    setupTrainingInProgress();
  }, [activeTraining, user, pathname]);

  useEffect(() => {
    const saveTrainingInProgress = async () => {
      if (!trainingInProgress) return;

      // Here also store
      const objectToStore: TrainingInProgressIndexDB = {
        startOfTraining: trainingInProgress.startOfTraining,
        recordedSets: trainingInProgress.recordedSets,
      };

      await lib.common.indexedDb.items.put({
        id: STORED_TRAINING_IN_PROGRESS,
        payload: JSON.stringify(objectToStore),
        updatedAt: Date.now(),
      });
    };

    saveTrainingInProgress();
  }, [trainingInProgress, isLoaded]);

  const clearTrainingState = async () => {
    setTrainingInProgress(null);
    await lib.common.indexedDb.items.delete(STORED_TRAINING_IN_PROGRESS);
  };

  const updateTrainingInProgress = (
    exercise: TrainingExercise,
    supersetIndex: number
  ) => {
    if (!trainingInProgress) return;

    const newTrainingInProgress: TrainingInProgress = {
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
    <TrainingsContext.Provider
      value={{
        reports,
        clearTrainingState,
        trainingInProgress,
        setTrainingInProgress,
        isLoaded,
        updateTrainingInProgress,
      }}
    >
      {children}
    </TrainingsContext.Provider>
  );
};

export const useTrainings = () => useContext(TrainingsContext)!;
