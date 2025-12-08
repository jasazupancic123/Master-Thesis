'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { useAuthenticatedAuth } from './auth.provider';
import { useMain } from './main.provider';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import type { TrainingInProgressIndexDB } from '@/core/training/type/training-in-progress-indexdb';
import { lib } from '@/lib';
import { type SetState } from '@/lib/common/type/state.type';

export const TRAINING_IN_PROGRESS_STORAGE_KEY = 'blindoff_training_in_progress';

interface ITrainingsContextProps {
  clearTrainingState: () => Promise<void>;
  trainingInProgress: TrainingInProgress | null;
  setTrainingInProgress: SetState<TrainingInProgress | null>;
  isLoaded: boolean;
}

const TrainingsContext = createContext<ITrainingsContextProps | undefined>(
  undefined
);

export type ITrainingsContext = ReturnType<typeof useTrainings>;

export type ITrainingsContextDefined = Omit<
  ReturnType<typeof useTrainings>,
  'trainingInProgress'
> & {
  trainingInProgress: TrainingInProgress;
};

export const TrainingsProvider = (props: React.PropsWithChildren) => {
  const { activeTraining } = useMain();
  const { children } = props;

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
          userId: user.uid,
          training: activeTraining,
          componentId: component.id,
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

  return (
    <TrainingsContext.Provider
      value={{
        clearTrainingState,
        trainingInProgress,
        setTrainingInProgress,
        isLoaded,
      }}
    >
      {children}
    </TrainingsContext.Provider>
  );
};

export const useTrainings = () => useContext(TrainingsContext)!;
