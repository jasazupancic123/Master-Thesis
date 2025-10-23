import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { ITrainerDayViewContext } from '@/store/trainer-day-view.provider';

export function handleSelectTrainingComponent(
  input: {
    trainingComponent: TrainingComponent | undefined;
  },
  context: {
    useTrainerDayViewContext: ITrainerDayViewContext;
  }
) {
  const { trainingComponent } = input;

  const { useTrainerDayViewContext } = context;

  const {
    training,
    component,
    setComponent,
    setTraining,
    setSelectedExerciseIds,
  } = useTrainerDayViewContext;

  if (trainingComponent && component && trainingComponent.id === component.id) {
    setComponent(undefined);
  } else {
    setTraining(training);
    setComponent(trainingComponent);
  }

  setSelectedExerciseIds([]);
}

export const stateUpdate = (
  input: { updatedComponent: TrainingComponent },
  context: {
    useTrainerDayViewContext: ITrainerDayViewContext;
  }
) => {
  const { updatedComponent } = input;

  const { useTrainerDayViewContext } = context;

  const { training, setTraining, setComponent } = useTrainerDayViewContext;

  if (!training) return;

  setComponent(updatedComponent);

  const updatedComponents = training.components.map((c) => {
    if (
      c.id === updatedComponent.id ||
      c.component?.id === updatedComponent.component?.id
    ) {
      return {
        ...updatedComponent,
      };
    }
    return c;
  });

  setTraining((prev) =>
    !prev
      ? prev
      : {
          ...prev,
          components: updatedComponents,
        }
  );
};
