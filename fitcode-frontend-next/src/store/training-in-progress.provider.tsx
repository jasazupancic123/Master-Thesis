'use client';

import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useMain } from './main.provider';
import { useTraining } from './training.provider';
import { core } from '@/core/core.service';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import { TrainingController } from '@/core/training/training.controller';
import { TrainingAction } from '@/core/training/type/training-action.type';
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
  addExerciseToSuperset: (exercise: Exercise) => Promise<void>;
  removeExerciseFromSuperset: (exerciseId: string) => Promise<void>;
  addSetToExercise: () => Promise<void>;
  removeSetFromExercise: (
    exerciseId: string,
    setIndex: number
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
  const {
    trainingInProgress,
    updateTrainingInProgress,
    setTrainingInProgress,
  } = useTraining();

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
          (a, b) =>
            new Date(a.startTimestamp).getTime() -
            new Date(b.startTimestamp).getTime()
        )[0]?.startTimestamp;

      if (currentSetStart) body.from = new Date(currentSetStart);
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
        const recTime = Math.abs(
          dayjs(body.from).diff(
            dayjs(prevWorkload.to || prevWorkload.timestamp),
            'second'
          )
        );

        prevWorkload.recTime = recTime;
        if (prevWorkload.repsR) prevWorkload.recTimeR = recTime;

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
            updatedPreviousWorkload = fetchedPrevWorkload;

            const exercise = trainingInProgress.supersets[
              stateSupersetIndex
            ].exercises.find((ex) => ex.id === exerciseId);

            if (exercise) {
              const set = exercise.sets[stateSetIndex - 1]; // previous set

              if (set) {
                set.recTime = recTime;
                if (set.repsR) set.recTimeR = recTime;
                updateTrainingInProgress(exercise, supersetIndex || 0);
              }
            }
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

  async function addExerciseToSuperset(exercise: Exercise) {
    if (!trainingInProgress) return;

    try {
      await TrainingController.getInstance().modifyTraining(
        trainingInProgress.training.id,
        {
          action: TrainingAction.ADD_EXERCISE,
          ref: {
            componentId: trainingInProgress.selectedComponent.id,
            supersetIndex: supersetIndex!,
            exerciseId: exercise.id,
          },
          payload: {},
        }
      );

      // update local state
      const newTrainingExercise: TrainingExercise = {
        id: exercise.id,
        sets: [],
        exercise,
      };

      setTrainingInProgress({
        ...trainingInProgress,
        selectedComponent: {
          ...trainingInProgress.selectedComponent,
          supersets: trainingInProgress.selectedComponent.supersets.map(
            (superset) => ({
              ...superset,
              exercises: [...superset.exercises, newTrainingExercise],
            })
          ),
        },
        supersets: trainingInProgress.supersets.map((superset, index) =>
          index === supersetIndex
            ? {
                ...superset,
                exercises: [...superset.exercises, newTrainingExercise],
              }
            : superset
        ),
      });
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to add exercise');
    }
  }

  async function removeExerciseFromSuperset(exerciseId: string) {
    if (!trainingInProgress) return;

    try {
      await TrainingController.getInstance().modifyTraining(
        trainingInProgress.training.id,
        {
          action: TrainingAction.REMOVE_EXERCISE,
          ref: {
            componentId: trainingInProgress.selectedComponent.id,
            supersetIndex: supersetIndex!,
            exerciseId,
          },
          payload: {},
        }
      );

      // update local state
      setTrainingInProgress({
        ...trainingInProgress,
        selectedComponent: {
          ...trainingInProgress.selectedComponent,
          supersets: trainingInProgress.selectedComponent.supersets.map(
            (superset) => ({
              ...superset,
              exercises: superset.exercises.filter((e) => e.id !== exerciseId),
            })
          ),
        },
        supersets: trainingInProgress.supersets.map((superset, index) =>
          index === supersetIndex
            ? {
                ...superset,
                exercises: superset.exercises.filter(
                  (e) => e.id !== exerciseId
                ),
              }
            : superset
        ),
      });
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to remove exercise');
    }
  }

  async function addSetToExercise() {
    if (!trainingInProgress || !selectedExercise) return;

    const set = core.training.set.stub(
      selectedExercise.sets.length + 1,
      selectedExercise.exercise!
    );

    try {
      await TrainingController.getInstance().modifyTraining(
        trainingInProgress.training.id,
        {
          action: TrainingAction.ADD_SET,
          ref: {
            componentId: trainingInProgress.selectedComponent.id,
            supersetIndex: supersetIndex!,
            exerciseId: selectedExercise!.id,
          },
          payload: {
            set,
          },
        }
      );

      const newExercise = {
        ...selectedExercise,
        sets: [
          ...selectedExercise.sets,
          core.training.set.stub(
            selectedExercise.sets.length + 1,
            selectedExercise.exercise!
          ),
        ],
      };

      setSelectedExercise(newExercise);

      // update local state
      setTrainingInProgress({
        ...trainingInProgress,
        selectedComponent: {
          ...trainingInProgress.selectedComponent,
          supersets: trainingInProgress.selectedComponent.supersets.map(
            (superset, sIndex) =>
              sIndex === supersetIndex
                ? {
                    ...superset,
                    exercises: superset.exercises.map((exercise) =>
                      exercise.id === selectedExercise.id
                        ? newExercise
                        : exercise
                    ),
                  }
                : superset
          ),
        },
        supersets: trainingInProgress.supersets.map((superset, sIndex) =>
          sIndex === supersetIndex
            ? {
                ...superset,
                exercises: superset.exercises.map((exercise) =>
                  exercise.id === selectedExercise.id ? newExercise : exercise
                ),
              }
            : superset
        ),
      });
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to add set');
    }
  }

  async function removeSetFromExercise(exerciseId: string, setIndex: number) {
    if (!trainingInProgress) return;

    try {
      await TrainingController.getInstance().modifyTraining(
        trainingInProgress.training.id,
        {
          action: TrainingAction.REMOVE_SET,
          ref: {
            componentId: trainingInProgress.selectedComponent.id,
            supersetIndex: supersetIndex!,
            exerciseId,
          },
          payload: {},
        }
      );

      // update local state
      setTrainingInProgress({
        ...trainingInProgress,
        selectedComponent: {
          ...trainingInProgress.selectedComponent,
          supersets: trainingInProgress.selectedComponent.supersets.map(
            (superset, sIndex) =>
              sIndex === supersetIndex
                ? {
                    ...superset,
                    exercises: superset.exercises.map((exercise) =>
                      exercise.id === exerciseId
                        ? {
                            ...exercise,
                            sets: exercise.sets.filter(
                              (_, index) => index !== setIndex
                            ),
                          }
                        : exercise
                    ),
                  }
                : superset
          ),
        },
        supersets: trainingInProgress.supersets.map((superset, sIndex) =>
          sIndex === supersetIndex
            ? {
                ...superset,
                exercises: superset.exercises.map((exercise) =>
                  exercise.id === exerciseId
                    ? {
                        ...exercise,
                        sets: exercise.sets.filter(
                          (_, index) => index !== setIndex
                        ),
                      }
                    : exercise
                ),
              }
            : superset
        ),
      });
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to remove set');
    }
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
        addExerciseToSuperset,
        removeExerciseFromSuperset,
        addSetToExercise,
        removeSetFromExercise,
      }}
    >
      {children}
    </TrainingInProgressContext.Provider>
  );
};
