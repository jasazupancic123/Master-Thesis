import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Method } from '@/controller/method/type/method.type';
import { Target } from '@/controller/target/type/target.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { Training } from '@/controller/training/type/training.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export async function handleAddTrainingComponents(
  controller: TrainingController,
  input: { trainingId: string; components: TrainingComponent[] },
  state: {
    router: AppRouterInstance;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
    methods: Method[];
    selectedTargets: { componentId: string; target: Target }[];
  }
) {
  const { trainingId, ...restInput } = input;
  const {
    router,
    setTrainings,
    components,
    exercises,
    methods,
    selectedTargets,
  } = state;

  restInput.components.forEach((component) => {
    const selectedTarget = selectedTargets.find(
      (m) => m.componentId === component.id
    );
    if (selectedTarget) component.target = selectedTarget.target;
  });

  handleApiRequest(
    router,
    () =>
      !restInput.components.length
        ? // if outside box was clicked, delete the whole training
          controller.delete(trainingId)
        : // else, add components
          controller.addComponents(trainingId, restInput),
    (training) => {
      if (!training) {
        // training was deleted
        setTrainings((prev) => prev.filter((t) => t.id !== trainingId));
        toast.success('Training deleted successfully');
        return;
      }

      // add components to training
      TrainingService.mapData(training, {
        components,
        exercises,
        methods,
      });

      setTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );

      toast.success(
        restInput.components.length > 1
          ? 'Training components added successfully'
          : 'Training component added successfully'
      );
    },
    undefined,
    'Failed to add training components'
  );
}

export async function handleDeleteTrainingComponent(
  controller: TrainingController,
  input: {
    trainingId: string;
    componentId: string;
  },
  state: {
    router: AppRouterInstance;
    setTrainings: SetState<Training[]>;
    components: Component[];
    exercises: Exercise[];
    methods: Method[];
  }
) {
  const { trainingId, componentId } = input;
  const { router, setTrainings, components, exercises, methods } = state;

  handleApiRequest(
    router,
    () => controller.deleteComponent(trainingId, componentId),
    (training) => {
      TrainingService.mapData(training, {
        components,
        exercises,
        methods,
      });

      if (training.components.length === 0) {
        // traning was deleted
        setTrainings((prev) => prev.filter((t) => t.id !== training.id));
      } else {
        setTrainings((prev) =>
          prev.map((t) => (t.id === trainingId ? training : t))
        );
      }
    },
    undefined,
    'Failed to delete training component'
  );
}
