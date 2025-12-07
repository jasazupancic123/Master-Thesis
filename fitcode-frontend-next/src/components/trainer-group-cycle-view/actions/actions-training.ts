import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Target } from '@/core/exercise/type/target.type';
import type { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { Fetch } from '@/lib/common/type/fetch.type';
import type { SetState } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';

export async function handleAddTrainingComponents(
  controller: TrainingController,
  input: { trainingId: string; components: TrainingComponent[] },
  state: {
    router: AppRouterInstance;
    setTrainings: SetState<Fetch<Training[]>>;
    exercises: Exercise[];
    selectedTargets: { componentId: string; target: Target }[];
  }
) {
  const { trainingId, ...restInput } = input;
  const { router, setTrainings, exercises, selectedTargets } = state;

  restInput.components.forEach((component) => {
    const selectedTarget = selectedTargets.find(
      (m) => m.componentId === component.id
    );

    if (selectedTarget)
      component.targetId = selectedTarget.target?.field as string;
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
        console.log('trainings 2');
        setTrainings((prev) => ({
          ...prev,
          data: prev.data.filter((t) => t.id !== trainingId),
        }));

        toast.success('Training deleted successfully');
        return;
      }

      // add components to training
      TrainingService.mapData(training, { exercises });
      console.log('trainings 3');
      setTrainings((prev) => ({
        ...prev,
        data: prev.data.map((t) => (t.id === training.id ? training : t)),
      }));

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
    setTrainings: SetState<Fetch<Training[]>>;
    exercises: Exercise[];
  }
) {
  const { trainingId, componentId } = input;
  const { router, setTrainings, exercises } = state;

  handleApiRequest(
    router,
    () => controller.deleteComponent(trainingId, componentId),
    (training) => {
      TrainingService.mapData(training, { exercises });

      if (training.components.length === 0) {
        // traning was deleted
        console.log('trainings 4');
        setTrainings((prev) => ({
          ...prev,
          data: prev.data.filter((t) => t.id !== training.id),
        }));
      } else {
        console.log('trainings 5');
        setTrainings((prev) => ({
          ...prev,
          data: prev.data.map((t) => (t.id === trainingId ? training : t)),
        }));
      }
    },
    undefined,
    'Failed to delete training component'
  );
}
