import type { ITrainingInProgressContext } from '@/store/training-in-progress.provider';
import type { ITrainingsContextDefined } from '@/store/trainings.provider';

export const goToNextExercise = (context: {
  useTraining: ITrainingsContextDefined;
  useTrainingInProgress: ITrainingInProgressContext;
}) => {
  const { useTraining, useTrainingInProgress } = context;

  const { trainingInProgress } = useTraining;

  const { selectedExercise, supersetIndex, setSelectedExercise, setSetIndex } =
    useTrainingInProgress;

  if (!selectedExercise) return;

  const component = trainingInProgress.training.components.find(
    (comp) => comp.id === trainingInProgress.componentId
  );

  if (!component) return;

  const selectedSuperset = component.supersets[supersetIndex!];

  if (!selectedSuperset) return;

  const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
  const nextExercise = selectedSuperset.exercises[currentIndex + 1];
  if (nextExercise) {
    setSelectedExercise(nextExercise);
    setSetIndex(0);
  }
};

export const goToPreviousExercise = (context: {
  useTraining: ITrainingsContextDefined;
  useTrainingInProgress: ITrainingInProgressContext;
}) => {
  const { useTraining, useTrainingInProgress } = context;

  const { trainingInProgress } = useTraining;

  const { selectedExercise, supersetIndex, setSelectedExercise, setSetIndex } =
    useTrainingInProgress;

  const component = trainingInProgress.training.components.find(
    (comp) => comp.id === trainingInProgress.componentId
  );

  if (!component) return;

  const selectedSuperset = component.supersets[supersetIndex!];

  if (!selectedSuperset || !selectedExercise) return;

  const currentIndex = selectedSuperset.exercises.indexOf(selectedExercise);
  const previousExercise = selectedSuperset.exercises[currentIndex - 1];
  if (previousExercise) {
    setSelectedExercise(previousExercise);
    setSetIndex(0);
  }
};
