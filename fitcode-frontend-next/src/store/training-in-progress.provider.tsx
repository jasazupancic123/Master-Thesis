import { createContext, useContext, useEffect, useState } from 'react';

import { useTraining } from './training.provider';
import type { ChildrenProps } from '@/common/type/props.type';
import type { SetState } from '@/common/type/state.type';
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
}

const TrainingInProgressContext = createContext<
  TrainingInProgressContextType | undefined
>(undefined);

export const TrainingInProgressProvider = (props: ChildrenProps) => {
  const { trainingInProgress } = useTraining();

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
      }}
    >
      {children}
    </TrainingInProgressContext.Provider>
  );
};

export const useTrainingInProgress = () =>
  useContext(TrainingInProgressContext)!;
