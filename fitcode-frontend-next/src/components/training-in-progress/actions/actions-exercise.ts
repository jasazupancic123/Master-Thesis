import type { TrainingExerciseRecording } from '@/core/training/type/training-exercise.type';
import type { TrainingProviderReturnTypeDefined } from '@/store/training.provider';
import type { ITrainingInProgressCtx } from '@/store/training-in-progress.provider';

export function updateTrainingExerciseWithAI(
  repsCountL: number,
  repsCountR: number | undefined,
  tempoL: string | null,
  tempoR: string | null | undefined,
  passedExercise: TrainingExerciseRecording | undefined,
  updateSelectedExercise: boolean | undefined,
  trainingCtx: TrainingProviderReturnTypeDefined,
  trainingInProgressCtx: ITrainingInProgressCtx
) {
  const { trainingInProgress, updateTrainingInProgress } = trainingCtx;
  const { selectedExercise, setSelectedExercise, supersetIndex, setIndex } =
    trainingInProgressCtx;

  if (supersetIndex === undefined) return;
  if (setIndex === undefined) return;

  const updatableExercise = passedExercise || selectedExercise;
  if (!updatableExercise) return;

  const selectedSet = updatableExercise.sets[setIndex];

  if (!selectedSet) return;

  /* updateExerciseAttributeValues(
    {
      newValue: repsCount.toString(),
      i: setIndex,
      set: selectedSet,
      lOrR: 'L',
      correctSelectedExercises: [updatableExercise],
      correctExercise: updatableExercise,
      correctParam: REPS,
      correctSupersets: trainingInProgress.supersets,
      correctSelectedSubgroup: null,
    },
    {
      training: trainingInProgress.training,
      component: trainingInProgress.selectedComponent,
      setTraining: () => {},
      setDetectedChanges: () => {},
      setSelectedSubgroup: () => {},
    }
  ); */

  /* updateExerciseAttributeValues(
    {
      newValue: tempo.toString(),
      i: setIndex,
      set: selectedSet,
      lOrR: 'L',
      correctSelectedExercises: [updatableExercise],
      correctExercise: updatableExercise,
      correctParam: TEMPO,
      correctSupersets: trainingInProgress.supersets,
      correctSelectedSubgroup: null,
    },
    {
      training: trainingInProgress.training,
      component: trainingInProgress.selectedComponent,
      setTraining: () => {},
      setDetectedChanges: () => {},
      setSelectedSubgroup: () => {},
    }
  ); */

  if (updateSelectedExercise) setSelectedExercise(updatableExercise);
  updateTrainingInProgress(updatableExercise, supersetIndex);
}

export const goToNextExercise = (context: {
  useTrainingInProgress: ITrainingInProgressCtx;
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
  useTrainingInProgress: ITrainingInProgressCtx;
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
