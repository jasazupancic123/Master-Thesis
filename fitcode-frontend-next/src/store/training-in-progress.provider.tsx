'use client';

import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useTrainings } from './trainings.provider';
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
  workloads: Workload[];
  setWorkloads: SetState<Workload[]>;
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
  updateWorkloadValue: (
    id: {
      userId: string;
      trainingId: string;
      componentId: string;
      exerciseId: string;
      supersetIndex: number;
      setNumber: number;
    },
    field: keyof Workload,
    value: Workload[keyof Workload]
  ) => void;
}

const TrainingInProgressContext =
  createContext<ITrainingInProgressContext | null>(null);

export const useTrainingInProgress = () =>
  useContext(TrainingInProgressContext)!;

export const TrainingInProgressProvider = ({
  children,
}: React.PropsWithChildren) => {
  const { trainingInProgress, setTrainingInProgress } = useTrainings();

  const router = useRouter();

  const [selectedExercise, setSelectedExercise] = useState<
    TrainingExercise | undefined
  >(undefined);

  const [supersetIndex, setSupersetIndex] = useState<number | undefined>(
    undefined
  );

  const [setIndex, setSetIndex] = useState<number | undefined>(undefined);

  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [initedAudioEnabled, setInitedAudioEnabled] = useState<boolean>(false);

  const [workloads, setWorkloads] = useState<Workload[]>([]);

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

  // Workloads listener
  useEffect(() => {
    if (!trainingInProgress) return;

    const unsub = lib.firebase.firestore.listenCollection<Workload>(
      `trainings/${trainingInProgress.training.id}/training-workload`,
      (snapshot) => {
        const data: Workload[] = snapshot.docs.map((doc) =>
          lib.firebase.firestore.serialize(doc.data())
        );

        setWorkloads(data);
      },
      (error) => {
        console.error('Error loading workloads:', error);
      }
    );

    return () => unsub();
  }, [trainingInProgress?.training.id]);

  const updateWorkloadValue = <K extends keyof Workload>(
    id: {
      userId: string;
      trainingId: string;
      componentId: string;
      exerciseId: string;
      supersetIndex: number;
      setNumber: number;
    },
    field: K,
    value: Workload[K]
  ) => {
    if (!trainingInProgress) return;

    const workload = workloads.find(
      (w) =>
        w.trainingId === id.trainingId &&
        w.componentId === id.componentId &&
        w.exerciseId === id.exerciseId &&
        w.supersetIndex === id.supersetIndex &&
        w.setNumber === id.setNumber
    );

    if (!workload) {
      const newWorkload =
        core.training.workload.createEmptyWorkloadFromTraining(
          id,
          trainingInProgress.training
        );

      if (!newWorkload) return;

      newWorkload[field] = value;

      setWorkloads((prev) => [...prev, newWorkload]);
      return;
    }

    if (!(field in workload)) return;

    workload[field] = value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (workload as any).id = undefined; // force update - remove id to make it "un-posted"

    setWorkloads((prev) =>
      prev.map((w) => (w.id === workload.id ? workload : w))
    );
  };

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
    } = state || {};

    if (
      !trainingInProgress?.componentId ||
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

    handleApiRequest(
      router,
      () =>
        TrainingController.getInstance().upsertSet(
          trainingInProgress.training.id,
          trainingInProgress.componentId,
          exerciseId,
          stateSupersetIndex,
          stateSetIndex + 1,
          { ...body, userId: trainingInProgress.userId }
        ),
      (_) => {
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
            componentId: trainingInProgress.componentId,
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

      const updatedTrainingInProgress = {
        ...trainingInProgress,
        training: {
          ...trainingInProgress.training,
          components: trainingInProgress.training.components.map((component) =>
            component.id === trainingInProgress.componentId
              ? {
                  ...component,
                  supersets: component.supersets.map((superset, index) =>
                    index === supersetIndex
                      ? {
                          ...superset,
                          exercises: [
                            ...superset.exercises,
                            newTrainingExercise,
                          ],
                        }
                      : superset
                  ),
                }
              : component
          ),
        },
      };

      setTrainingInProgress(updatedTrainingInProgress);
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
            componentId: trainingInProgress.componentId,
            supersetIndex: supersetIndex!,
            exerciseId,
          },
          payload: {},
        }
      );

      const updatedTrainingInProgress = {
        ...trainingInProgress,
        training: {
          ...trainingInProgress.training,
          components: trainingInProgress.training.components.map((component) =>
            component.id === trainingInProgress.componentId
              ? {
                  ...component,
                  supersets: component.supersets.map((superset, index) =>
                    index === supersetIndex
                      ? {
                          ...superset,
                          exercises: superset.exercises.filter(
                            (e) => e.id !== exerciseId
                          ),
                        }
                      : superset
                  ),
                }
              : component
          ),
        },
      };

      setTrainingInProgress(updatedTrainingInProgress);
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
            componentId: trainingInProgress.componentId,
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

      const updatedTrainingInProgress = {
        ...trainingInProgress,
        training: {
          ...trainingInProgress.training,
          components: trainingInProgress.training.components.map((component) =>
            component.id === trainingInProgress.componentId
              ? {
                  ...component,
                  supersets: component.supersets.map((superset, index) =>
                    index === supersetIndex
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
                }
              : component
          ),
        },
      };

      // update local state
      setTrainingInProgress(updatedTrainingInProgress);
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
            componentId: trainingInProgress.componentId,
            supersetIndex: supersetIndex!,
            exerciseId,
          },
          payload: {},
        }
      );

      const updatedSelectedExercise =
        selectedExercise?.id === exerciseId
          ? {
              ...selectedExercise,
              sets: selectedExercise.sets.filter(
                (_, index) => index !== setIndex
              ),
            }
          : selectedExercise;

      setSelectedExercise(updatedSelectedExercise);

      const updatedTrainingInProgress = {
        ...trainingInProgress,
        training: {
          ...trainingInProgress.training,
          components: trainingInProgress.training.components.map((component) =>
            component.id === trainingInProgress.componentId
              ? {
                  ...component,
                  supersets: component.supersets.map((superset, sIndex) =>
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
                }
              : component
          ),
        },
      };

      setTrainingInProgress(updatedTrainingInProgress);
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
        workloads,
        setWorkloads,
        addExerciseToSuperset,
        removeExerciseFromSuperset,
        addSetToExercise,
        removeSetFromExercise,
        updateWorkloadValue,
      }}
    >
      {children}
    </TrainingInProgressContext.Provider>
  );
};
