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

  const tempoAIValuesL = tempoL
    ? tempoL.split(':').map((t) => parseFloat(t))
    : null;

  const tempoAIValuesR = tempoR
    ? tempoR.split(':').map((t) => parseFloat(t))
    : null;

  updatableExercise.sets[setIndex] = {
    ...selectedSet,
    reps: repsCountL,
    repsR: repsCountR,
    tempoEcc: tempoAIValuesL ? tempoAIValuesL[0] : selectedSet.tempoEcc,
    tempoIso: tempoAIValuesL ? tempoAIValuesL[1] : selectedSet.tempoIso,
    tempoCon: tempoAIValuesL ? tempoAIValuesL[2] : selectedSet.tempoCon,
    tempoIdle: tempoAIValuesL ? tempoAIValuesL[3] : selectedSet.tempoIdle,
    tempoEccR: tempoAIValuesR ? tempoAIValuesR[0] : selectedSet.tempoEccR,
    tempoIsoR: tempoAIValuesR ? tempoAIValuesR[1] : selectedSet.tempoIsoR,
    tempoConR: tempoAIValuesR ? tempoAIValuesR[2] : selectedSet.tempoConR,
    tempoIdleR: tempoAIValuesR ? tempoAIValuesR[3] : selectedSet.tempoIdleR,
  };

  if (updateSelectedExercise) setSelectedExercise(updatableExercise);
  updateTrainingInProgress(updatableExercise, supersetIndex);
}

export const goToNextExercise = (context: {
  useTraining: ITrainingContextDefined;
  useTrainingInProgress: ITrainingInProgressContext;
}) => {
  const { useTraining, useTrainingInProgress } = context;

  const { trainingInProgress } = useTraining;

  const { selectedExercise, supersetIndex, setSelectedExercise, setSetIndex } =
    useTrainingInProgress;

  if (!selectedExercise) return;

  const selectedSuperset = trainingInProgress.supersets[supersetIndex!];

  if (!selectedSuperset) return;

  const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
  const nextExercise = selectedSuperset.exercises[currentIndex + 1];
  if (nextExercise) {
    setSelectedExercise(nextExercise);
    setSetIndex(0);
  }
};

export const goToPreviousExercise = (context: {
  useTraining: ITrainingContextDefined;
  useTrainingInProgress: ITrainingInProgressContext;
}) => {
  const { useTraining, useTrainingInProgress } = context;

  const { trainingInProgress } = useTraining;

  const { selectedExercise, supersetIndex, setSelectedExercise, setSetIndex } =
    useTrainingInProgress;

  const selectedSuperset = trainingInProgress.supersets[supersetIndex!];

  if (!selectedSuperset || !selectedExercise) return;

  const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
  const previousExercise = selectedSuperset.exercises[currentIndex - 1];
  if (previousExercise) {
    setSelectedExercise(previousExercise);
    setSetIndex(0);
  }
};
