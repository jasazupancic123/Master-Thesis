import toast from 'react-hot-toast';

import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import type { IGroupCtx } from '@/store/group.provider';
import type { IMainContext } from '@/store/main.provider';
import type { ITrainerDayViewContext } from '@/store/trainer-day-view.provider';

export async function handleUpdateTraining(
  setIsUpdatingTraining: SetState<boolean>,
  mainCtx: IMainContext,
  groupCtx: IGroupCtx,
  trainerDayViewCtx: ITrainerDayViewContext
) {
  const { components, exercises, methods } = mainCtx;
  const { setTrainings, setDetectedChanges } = groupCtx;
  const { training, setTraining } = trainerDayViewCtx;

  if (!training) return toast.error('No training to update');
  setIsUpdatingTraining(true);

  const state = { training: structuredClone(training) };
  await lib.common.generic.optimisticUpdate(
    () => {
      setTrainings((prev) =>
        prev.map((t) => (t.id === training.id ? training : t))
      );
    },
    (snapshot, e) => {
      setIsUpdatingTraining(false);
      setTraining(snapshot.training);
      setTrainings((prev) =>
        prev.map((t) => (t.id === snapshot.training.id ? snapshot.training : t))
      );

      toast.error(e.message);
    },
    async () => TrainingController.getInstance().update(training.id, training),
    state,
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
      setIsUpdatingTraining(false);
      toast.success('Training updated successfully');
    }
  );
}
