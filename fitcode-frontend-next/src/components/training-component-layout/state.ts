import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { Component } from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Method } from '@/controller/method/type/method.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingInfo } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

export async function handleCopyComponentApiRequest(
  input: {
    training: Training;
    trainingInPeriod: TrainingInfo;
    component: TrainingComponent;
  },
  state: {
    router: AppRouterInstance;
    allComponents: Component[];
    allExercises: Exercise[];
    allMethods: Method[];
    setTrainings: SetState<TrainingInfo[]>;
  }
) {
  const { training, trainingInPeriod, component } = input;

  const { router, allComponents, allExercises, allMethods, setTrainings } =
    state;

  handleApiRequest(
    router,
    () =>
      TrainingController.copyComponent({
        copyFromTrainingId: training.id,
        copyToTrainingId: trainingInPeriod.id,
        componentId: component.id,
      }),
    (training) => {
      TrainingService.mapData(training, {
        components: allComponents,
        exercises: allExercises,
        methods: allMethods,
        prescribedStats: true,
      });

      const minimalTraining = TrainingService.trainingToInfo(training);

      setTrainings((prev) =>
        prev.map((t) => {
          if (t.id === minimalTraining.id) return minimalTraining;
          return t;
        })
      );

      toast.success('Component copied successfully');
    },
    undefined,
    'Failed to copy component'
  );
}
