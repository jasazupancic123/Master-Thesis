'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useMain } from './main.provider';
import { useTraining } from './training.provider';
import { TrainingController } from '@/core/training/training.controller';
import type {
  TrainingExercise,
  TrainingExerciseRecordedSet,
} from '@/core/training/type/training-exercise.type';
import type {
  CreateWorkload,
  Workload,
} from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import { INDEXED_DB_FIELDS } from '@/lib/common/const/indexed-db-fields.const';
import { handleApiRequest, type SetState } from '@/lib/common/type/state.type';
import dayjs from 'dayjs';
import { core } from '@/core/core.service';

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
    },
    workloads: Workload[],
    recordedSets: TrainingExerciseRecordedSet[]
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
    },
    workloads: Workload[],
    recordedSets: TrainingExerciseRecordedSet[]
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

    // setting from
    const currentRecordedSet = recordedSets.find(
      (rs) =>
        rs.exerciseId === exerciseId &&
        rs.supersetIndex === stateSupersetIndex &&
        rs.setIndex === stateSetIndex
    );

    if (currentRecordedSet) {
      // was recorded with ai
      const currentSetStart = currentRecordedSet.repsL
        .concat(currentRecordedSet.repsR || [])
        .sort(
          (a, b) => a.startTimestamp.getTime() - b.startTimestamp.getTime()
        )[0]?.startTimestamp;

      if (currentSetStart) body.from = currentSetStart;
    }

    if (!body.from) {
      // was not recorded with ai
      const currentSetActiveTimeS =
        core.training.workload.getActiveWorkloadTimeS(body);

      body.from = dayjs().subtract(currentSetActiveTimeS, 'second').toDate();
    }

    let updatedPreviousWorkload: Workload | undefined = undefined;

    if (workloads.length > 0 && stateSetIndex > 0) {
      // we have previous workloads and this is not the first set
      const prevWorkload = workloads.find(
        (w) =>
          w.trainingId === trainingInProgress.training.id &&
          w.componentId === trainingInProgress.selectedComponent.id &&
          w.exerciseId === exerciseId &&
          w.supersetIndex === stateSupersetIndex &&
          w.setNumber === stateSetIndex // previous set (setNumber is 1-based, setIndex is 0-based)
      );

      if (prevWorkload) {
        prevWorkload.recTime = Math.abs(
          dayjs(body.from).diff(
            dayjs(prevWorkload.to || prevWorkload.timestamp),
            'second'
          )
        );

        handleApiRequest(
          router,
          () =>
            TrainingController.getInstance().upsertSet(
              trainingInProgress.training.id,
              trainingInProgress.selectedComponent.id,
              exerciseId,
              stateSupersetIndex,
              stateSetIndex, // previous set (setNumber is 1-based, setIndex is 0-based)
              { ...prevWorkload, userId: trainingInProgress.userId }
            ),
          (fetchedPrevWorkload) => {
            console.log('fetchedPrevWorkload', fetchedPrevWorkload);
            updatedPreviousWorkload = fetchedPrevWorkload;
          }
        );
      }
    }

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

          let prevWorkloads = [...prev.workloads];

          const workloadExists = prevWorkloads.find(
            (w) => w.id === workload.id
          );

          prevWorkloads = workloadExists
            ? prevWorkloads.map((w) => (w.id === workload.id ? workload : w))
            : [...prevWorkloads, workload];

          if (updatedPreviousWorkload !== undefined) {
            // update previous workload in state

            const previousWorkloadExists = prevWorkloads.find(
              (w) => w.id === updatedPreviousWorkload?.id
            );

            prevWorkloads = previousWorkloadExists
              ? prevWorkloads.map((w) =>
                  w.id === updatedPreviousWorkload?.id
                    ? updatedPreviousWorkload
                    : w
                )
              : [...prevWorkloads, updatedPreviousWorkload];
          }

          prevWorkloads = prevWorkloads.filter((w) => w !== undefined);

          return {
            ...prev,
            workloads: prevWorkloads,
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
