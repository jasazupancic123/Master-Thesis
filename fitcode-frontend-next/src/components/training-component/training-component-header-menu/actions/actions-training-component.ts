import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainerDayViewProviderReturnType } from '@/store/trainer-day-view.provider';

export const stateUpdate = (
  input: { updatedComponent: TrainingComponent },
  context: {
    useTrainerDayViewContext: TrainerDayViewProviderReturnType;
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
