'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useTraining } from './training.provider';
import { TrainingController } from '@/core/training/training.controller';
import type {
  CreateWorkload,
  Workload,
} from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import { INDEXED_DB_FIELDS } from '@/lib/common/const/indexed-db-fields.const';
import { handleApiRequest, type SetState } from '@/lib/common/type/state.type';
import { useMain } from './main.provider';
import { TrainingExercise } from '@/core/training/type/training-exercise.type';

export interface ITrainingInProgressContext {
  selectedExercise: TrainingExercise | undefined;
  setSelectedExercise: SetState<TrainingExercise | undefined>;
  supersetIndex: number | undefined;
  setSupersetIndex: SetState<number | undefined>;
  setIndex: number | undefined;
  audioEnabled: boolean;
  setAudioEnabled: SetState<boolean>;
  initedAudioEnabled: boolean;
  setInitedAudioEnabled: SetState<boolean>;
  setSetIndex: SetState<number | undefined>;
  currentAiRecordedWorkload: Workload | null;
  setCurrentAiRecordedWorkload: SetState<Workload | null>;
  handleUpsertSet: (
    body: Omit<CreateWorkload, 'userId'>,
    state: {
      exerciseId: string;
      supersetIndex: number;
      setIndex: number;
      setCurrentAiRecordedWorkload?: SetState<Workload | null>;
    }
  ) => Promise<void>;
}

const TrainingInProgressContext =
  createContext<ITrainingInProgressContext | null>(null);

export const useTrainingInProgress = () =>
  useContext(TrainingInProgressContext)!;

export const TrainingInProgressProvider = ({
  children,
}: React.PropsWithChildren) => {
  const { setActiveTraining } = useMain();
  const { trainingInProgress } = useTraining();

  const router = useRouter();

  const [selectedExercise, setSelectedExercise] = useState<
    TrainingExercise | undefined
  >(undefined);

  const [supersetIndex, setSupersetIndex] = useState<number | undefined>(
    undefined
  );

  const [setIndex, setSetIndex] = useState<number | undefined>(undefined);

  const [currentAiRecordedWorkload, setCurrentAiRecordedWorkload] =
    useState<Workload | null>(null);

  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [initedAudioEnabled, setInitedAudioEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (
      !currentAiRecordedWorkload ||
      !selectedExercise ||
      setIndex === undefined
    )
      return;

    const isSameExercise =
      currentAiRecordedWorkload.componentId ===
        trainingInProgress?.selectedComponent.id &&
      currentAiRecordedWorkload.exerciseId === selectedExercise.id &&
      currentAiRecordedWorkload.supersetIndex === supersetIndex &&
      currentAiRecordedWorkload.setNumber === setIndex + 1;

    if (!isSameExercise) setCurrentAiRecordedWorkload(null);
  }, [selectedExercise, supersetIndex, setIndex]);

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
    state: {
      exerciseId: string;
      supersetIndex: number;
      setIndex: number;
      isAiRecorded?: boolean;
    }
  ) {
    const {
      exerciseId,
      supersetIndex: stateSupersetIndex,
      setIndex: stateSetIndex,
      isAiRecorded,
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
      (workload) => {
        if (isAiRecorded) setCurrentAiRecordedWorkload(workload);

        setActiveTraining((prev) => {
          if (!prev) return prev;

          const workloadExists = prev.training?.workloads.find(
            (w) => w.id === workload.id
          );

          return {
            ...prev,
            training: prev.training
              ? {
                  ...prev.training,
                  workloads: workloadExists
                    ? prev.training.workloads.map((w) =>
                        w.id === workload.id ? workload : w
                      )
                    : [...prev.training.workloads, workload],
                }
              : prev.training,
          };
        });

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
        currentAiRecordedWorkload,
        setCurrentAiRecordedWorkload,
      }}
    >
      {children}
    </TrainingInProgressContext.Provider>
  );
};
