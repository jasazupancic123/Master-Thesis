import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useTraining } from './training.provider';
import type { ChildrenProps } from '@/common/type/props.type';
import { handleApiRequest, type SetState } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import type { CompleteSet } from '@/controller/training/type/complete-set.type';
import type { SupersetRecording } from '@/controller/training/type/superset.type';
import type { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';

interface TrainingInProgressContextType {
  selectedSuperset: SupersetRecording | undefined;
  setSelectedSuperset: SetState<SupersetRecording | undefined>;
  selectedExercise: TrainingExerciseRecording | undefined;
  setSelectedExercise: SetState<TrainingExerciseRecording | undefined>;
  supersetIndex: number | undefined;
  setSupersetIndex: SetState<number | undefined>;
  exerciseIndex: number | undefined;
  setExerciseIndex: SetState<number | undefined>;
  setIndex: number | undefined;
  setSetIndex: SetState<number | undefined>;
  handleUpsertSet: (
    body: Omit<CompleteSet, 'userId'>,
    state: { exerciseId: string; supersetIndex: number; setIndex: number }
  ) => Promise<void>;
}

const TrainingInProgressContext = createContext<
  TrainingInProgressContextType | undefined
>(undefined);

export type TrainingInProgressProviderReturnType = ReturnType<
  typeof useTrainingInProgress
>;

export const TrainingInProgressProvider = (props: ChildrenProps) => {
  const { trainingInProgress, refetchTraining } = useTraining();
  const router = useRouter();
  const controller = TrainingController.getInstance();
  const { children } = props;

  const [selectedSuperset, setSelectedSuperset] = useState<
    SupersetRecording | undefined
  >(undefined);
  const [selectedExercise, setSelectedExercise] = useState<
    TrainingExerciseRecording | undefined
  >(undefined);
  const [supersetIndex, setSupersetIndex] = useState<number | undefined>(
    undefined
  );
  const [exerciseIndex, setExerciseIndex] = useState<number | undefined>(
    undefined
  );
  const [setIndex, setSetIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!trainingInProgress || !selectedSuperset) {
      setSelectedExercise(undefined);
      return;
    }
    setSupersetIndex(
      trainingInProgress.selectedComponent.supersets.indexOf(selectedSuperset)
    );
  }, [selectedSuperset]);

  useEffect(() => {
    if (!trainingInProgress || !selectedExercise) {
      setExerciseIndex(undefined);
      return;
    }

    const foundExercise = selectedSuperset?.exercises.find(
      (ex) => ex.id === selectedExercise.id
    );

    if (foundExercise) {
      const newExerciseIndex =
        selectedSuperset?.exercises.indexOf(foundExercise);

      if (newExerciseIndex !== undefined && newExerciseIndex > -1)
        setExerciseIndex(newExerciseIndex);
    }
  }, [selectedExercise]);

  async function handleUpsertSet(
    body: Omit<CompleteSet, 'userId'>,
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
        controller.upsertSet(
          trainingInProgress.training.id,
          trainingInProgress.selectedComponent.id,
          exerciseId,
          stateSupersetIndex,
          stateSetIndex + 1,
          { ...body, userId: trainingInProgress.userId }
        ),
      (_workload) => {
        toast.success('Saved');
        refetchTraining(trainingInProgress.training.id);
      }
    );
  }

  return (
    <TrainingInProgressContext.Provider
      value={{
        selectedSuperset,
        setSelectedSuperset,
        selectedExercise,
        setSelectedExercise,
        supersetIndex,
        setSupersetIndex,
        exerciseIndex,
        setExerciseIndex,
        setIndex,
        setSetIndex,
        handleUpsertSet,
      }}
    >
      {children}
    </TrainingInProgressContext.Provider>
  );
};

export const useTrainingInProgress = () =>
  useContext(TrainingInProgressContext)!;
