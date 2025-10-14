import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainerDayViewProviderReturnType } from '@/store/trainer-day-view.provider';

export function handleSelectTrainingComponent(
  input: {
    trainingComponent: TrainingComponent | undefined;
  },
  context: {
    useTrainerDayViewContext: TrainerDayViewProviderReturnType;
  }
) {
  const { trainingComponent } = input;

  const { useTrainerDayViewContext } = context;

  const {
    training,
    component,
    setComponent,
    setTraining,
    setSelectedExercises,
  } = useTrainerDayViewContext;

  if (trainingComponent && component && trainingComponent.id === component.id) {
    setComponent(undefined);
  } else {
    setTraining(training);
    setComponent(trainingComponent);
  }
  setSelectedExercises([]);
}
