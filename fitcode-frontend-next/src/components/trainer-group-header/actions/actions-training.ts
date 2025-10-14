import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import type { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { GroupProviderReturnType } from '@/store/group.provider';
import type { MainProviderReturnType } from '@/store/main.provider';
import type { TrainerDayViewProviderReturnType } from '@/store/trainer-day-view.provider';

export async function handleUpdateMultipleTrainings(
  input: {
    controller: TrainingController;
    router: AppRouterInstance;
    setIsUpdatingTraining: SetState<boolean>;
  },
  context: {
    useMain: MainProviderReturnType;
    useGroup: GroupProviderReturnType;
    useTrainerDayViewContext: TrainerDayViewProviderReturnType;
  }
) {
  const { router, controller, setIsUpdatingTraining } = input;

  const { useMain, useGroup, useTrainerDayViewContext } = context;

  const { components, exercises, methods } = useMain;

  const { setTrainings, setDetectedChanges } = useGroup;

  const { training, setTraining } = useTrainerDayViewContext;

  if (!training) {
    toast.error('No training to update');
    return;
  }

  setIsUpdatingTraining(true);

  await handleApiRequest(
    router,
    () =>
      controller.update(training.id, {
        ...training,
      }),
    (newTraining) => {
      TrainingService.mapData(newTraining, {
        components,
        exercises,
        methods,
      });

      setTraining(newTraining);

      setTrainings((prev) =>
        prev.map((t) => {
          if (t.id === newTraining.id) return newTraining;
          return t;
        })
      );

      setDetectedChanges(false);
      toast.success('Training updated successfully');
    },
    undefined,
    'Error when updating training'
  );

  setIsUpdatingTraining(false);
}
