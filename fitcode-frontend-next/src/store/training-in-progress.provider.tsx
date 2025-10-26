import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useTraining } from './training.provider';
import { TrainingController } from '@/core/training/training.controller';
import type { SupersetRecording } from '@/core/training/type/superset.type';
import type { TrainingExerciseRecording } from '@/core/training/type/training-exercise.type';
import type { CreateWorkload } from '@/core/training/type/workload.type';
import { handleApiRequest, type SetState } from '@/lib/common/type/state.type';

export interface ITrainingInProgressContext {
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
  const { trainingInProgress, refetchTraining } = useTraining();

  const router = useRouter();

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
    if (!trainingInProgress || !selectedSuperset) return;

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
