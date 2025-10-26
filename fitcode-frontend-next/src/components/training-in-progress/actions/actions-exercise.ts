import type { TrainingExerciseRecording } from '@/core/training/type/training-exercise.type';
import type { ITrainingContextDefined } from '@/store/training.provider';
import type { ITrainingInProgressContext } from '@/store/training-in-progress.provider';

export function updateTrainingExerciseWithAI(
  repsCountL: number,
  repsCountR: number | undefined,
  tempoL: string | null,
  tempoR: string | null | undefined,
  passedExercise: TrainingExerciseRecording | undefined,
  updateSelectedExercise: boolean | undefined,
  trainingCtx: ITrainingContextDefined,
  trainingInProgressCtx: ITrainingInProgressContext
) {
  const { updateTrainingInProgress } = trainingCtx;
  const { selectedExercise, setSelectedExercise, supersetIndex, setIndex } =
    trainingInProgressCtx;

  if (supersetIndex === undefined) return;
  if (setIndex === undefined) return;

  const updatableExercise = passedExercise || selectedExercise;
  if (!updatableExercise) return;

  const selectedSet = updatableExercise.sets[setIndex];

  if (!selectedSet) return;

  updatableExercise.sets[setIndex] = {
    ...selectedSet,
    reps: repsCountL,
    repsR: repsCountR,
    tempo: tempoL || selectedSet.tempo,
    tempoR: tempoR || undefined,
  };

  if (updateSelectedExercise) setSelectedExercise(updatableExercise);
  updateTrainingInProgress(updatableExercise, supersetIndex);
}

export const goToNextExercise = (context: {
  useTrainingInProgress: ITrainingInProgressContext;
}) => {
  const { useTrainingInProgress } = context;

  const {
    selectedSuperset,
    selectedExercise,
    setSelectedExercise,
    setSetIndex,
  } = useTrainingInProgress;

  if (!selectedSuperset || !selectedExercise) return;

  const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
  const nextExercise = selectedSuperset.exercises[currentIndex + 1];
  if (nextExercise) {
    setSelectedExercise(nextExercise);
    setSetIndex(0);
  }
};

export const goToPreviousExercise = (context: {
  useTrainingInProgress: ITrainingInProgressContext;
}) => {
  const { useTrainingInProgress } = context;

  const {
    selectedSuperset,
    selectedExercise,
    setSelectedExercise,
    setSetIndex,
  } = useTrainingInProgress;

  if (!selectedSuperset || !selectedExercise) return;

  const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
  const previousExercise = selectedSuperset.exercises[currentIndex - 1];
  if (previousExercise) {
    setSelectedExercise(previousExercise);
    setSetIndex(0);
  }
};
