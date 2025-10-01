import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuthenticatedAuth } from './auth.provider';
import { useTraining } from './training.provider';
import type { ChildrenProps } from '@/common/type/props.type';
import { handleApiRequest, type SetState } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import type { CompleteSet } from '@/controller/training/type/complete-set.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';

interface TrainingInProgressContextType {
  selectedSuperset: Superset | undefined;
  setSelectedSuperset: SetState<Superset | undefined>;
  selectedExercise: TrainingExercise | undefined;
  setSelectedExercise: SetState<TrainingExercise | undefined>;
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

export const TrainingInProgressProvider = (props: ChildrenProps) => {
  const { token } = useAuthenticatedAuth();
  const { trainingInProgress, refetchTraining } = useTraining();
  const router = useRouter();
  const controller = TrainingController.getInstance(token);

  const { children } = props;

  const [selectedSuperset, setSelectedSuperset] = useState<
    Superset | undefined
  >(undefined);
  const [selectedExercise, setSelectedExercise] = useState<
    TrainingExercise | undefined
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
    setExerciseIndex(selectedSuperset?.exercises.indexOf(selectedExercise));
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
