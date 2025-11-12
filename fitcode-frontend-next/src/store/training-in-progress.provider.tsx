'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useTraining } from './training.provider';
import { TrainingController } from '@/core/training/training.controller';
import type { TrainingExerciseRecording } from '@/core/training/type/training-exercise.type';
import type { CreateWorkload } from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import { INDEXED_DB_FIELDS } from '@/lib/common/const/indexed-db-fields.const';
import { handleApiRequest, type SetState } from '@/lib/common/type/state.type';

export interface ITrainingInProgressContext {
  selectedExercise: TrainingExerciseRecording | undefined;
  setSelectedExercise: SetState<TrainingExerciseRecording | undefined>;
  supersetIndex: number | undefined;
  setSupersetIndex: SetState<number | undefined>;
  setIndex: number | undefined;
  audioEnabled: boolean;
  setAudioEnabled: SetState<boolean>;
  initedAudioEnabled: boolean;
  setInitedAudioEnabled: SetState<boolean>;
  setSetIndex: SetState<number | undefined>;
  handleUpsertSet: (
    body: Omit<CreateWorkload, 'userId'>,
    state: { exerciseId: string; supersetIndex: number; setIndex: number }
  ) => Promise<void>;
}

const TrainingInProgressContext =
  createContext<ITrainingInProgressContext | null>(null);

export const useTrainingInProgress = () =>
  useContext(TrainingInProgressContext)!;

export const TrainingInProgressProvider = ({
  children,
}: React.PropsWithChildren) => {
  const { trainingInProgress } = useTraining();

  const router = useRouter();

  const [selectedExercise, setSelectedExercise] = useState<
    TrainingExerciseRecording | undefined
  >(undefined);

  const [supersetIndex, setSupersetIndex] = useState<number | undefined>(
    undefined
  );

  const [setIndex, setSetIndex] = useState<number | undefined>(undefined);

  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [initedAudioEnabled, setInitedAudioEnabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchAudioSetting = async () => {
      const item = await lib.common.indexedDb.items.get(
        INDEXED_DB_FIELDS.trainingInProgressAudio
      );

      if (item && typeof item.payload === 'boolean')
        setAudioEnabled(item.payload);
      setInitedAudioEnabled(true);
    };

    fetchAudioSetting();
  }, []);

  useEffect(() => {
    const updateIndexedDbAudioSetting = async () => {
      await lib.common.indexedDb.items.put({
        id: INDEXED_DB_FIELDS.trainingInProgressAudio,
        payload: audioEnabled,
        updatedAt: Date.now(),
      });
    };

    updateIndexedDbAudioSetting();
  }, [audioEnabled]);

  async function handleUpsertSet(
    body: Omit<CreateWorkload, 'userId'>,
    state: { exerciseId: string; supersetIndex: number; setIndex: number }
  ) {
    const {
      exerciseId,
      supersetIndex: stateSupersetIndex,
      setIndex: stateSetIndex,
    } = state || {};

    if (
      !trainingInProgress?.selectedComponent ||
      !trainingInProgress.userId ||
      !trainingInProgress.training
    )
      return;

    handleApiRequest(
      router,
      () =>
        TrainingController.getInstance().upsertSet(
          trainingInProgress.training.id,
          trainingInProgress.selectedComponent.id,
          exerciseId,
          stateSupersetIndex,
          stateSetIndex + 1,
          { ...body, userId: trainingInProgress.userId }
        ),
      (_workload) => {
        toast.success('Saved');
      }
    );
  }

  return (
    <TrainingInProgressContext.Provider
      value={{
        selectedExercise,
        setSelectedExercise,
        supersetIndex,
        setSupersetIndex,
        setIndex,
        setSetIndex,
        handleUpsertSet,
        audioEnabled,
        setAudioEnabled,
        initedAudioEnabled,
        setInitedAudioEnabled,
      }}
    >
      {children}
    </TrainingInProgressContext.Provider>
  );
};
