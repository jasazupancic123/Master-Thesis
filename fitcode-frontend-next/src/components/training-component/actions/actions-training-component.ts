import { core } from '@/core/core.service';
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
    selectedAthlete,
    selectedSubgroup,
    setSelectedSubgroup,
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

  if (selectedAthlete && trainingComponent) {
    const virtual =
      core.training.subgroup.getVirtual(
        selectedAthlete.uid,
        trainingComponent
      ) ||
      core.training.subgroup.createVirtual(
        selectedAthlete,
        selectedSubgroup,
        trainingComponent
      );

    const updatedComponent = structuredClone(trainingComponent);
    updatedComponent.subgroups = [
      ...updatedComponent.subgroups.filter((s) => s.id !== virtual.id),
      virtual,
    ];

    setSelectedSubgroup(virtual);
    setComponent(updatedComponent);
    setTraining((prev) =>
      !prev
        ? undefined
        : {
            ...prev,
            components: prev.components.map((c) =>
              c.id === updatedComponent.id ? updatedComponent : c
            ),
          }
    );
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
