import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { GroupEvent } from '@/core/group/type/group-event.type';
import { TrainingController } from '@/core/training/training.controller';
import type { TrainingComponentWithTrainingId } from '@/core/training/type/training-component.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import type { IGroupCtx } from '@/store/group.provider';

export async function handleUpdateTrainingTimes(
  input: {
    item: TrainingComponentWithTrainingId | GroupEvent;
    newItem: TrainingComponentWithTrainingId | GroupEvent;
    selectedItem: TrainingComponentWithTrainingId | GroupEvent | null;
    setSelectedItem: React.Dispatch<
      React.SetStateAction<
        (TrainingComponentWithTrainingId | GroupEvent) | null
      >
    >;
    checkIsTrainingComponent: (
      item: TrainingComponentWithTrainingId | GroupEvent
    ) => item is TrainingComponentWithTrainingId;
    router: AppRouterInstance;
  },
  groupCtx: IGroupCtx
) {
  const {
    item,
    newItem,
    selectedItem,
    setSelectedItem,
    router,
    checkIsTrainingComponent,
  } = input;

  const { setTrainings, setGroup } = groupCtx;
  if (!checkIsTrainingComponent(item) || !selectedItem) return;

  await handleApiRequest(
    router,
    () =>
      TrainingController.getInstance().updateComponentTime(
        item.trainingId,
        selectedItem.id,
        { from: newItem.from, to: newItem.to }
      ),
    (result) => {
      setSelectedItem((prev) => (prev ? newItem : null));

      if (checkIsTrainingComponent(newItem))
        setTrainings((prev) =>
          prev.map((t) =>
            t.id === item.trainingId
              ? {
                  ...t,
                  components: result.components
                    ? result.components.map((c) => {
                        const found = t.components.find(
                          (tc) => tc.id === c.id
                        )!;

                        return { ...found, from: c.from, to: c.to };
                      })
                    : t.components,
                  warmup: result.warmup
                    ? {
                        ...t.warmup,
                        from: result.warmup.from,
                        to: result.warmup.to,
                      }
                    : t.warmup,
                  cooldown: result.cooldown
                    ? {
                        ...t.cooldown,
                        from: result.cooldown.from,
                        to: result.cooldown.to,
                      }
                    : t.cooldown,
                  from: result.from || t.from,
                  to: result.to || t.to,
                }
              : t
          )
        );
      else
        setGroup((prev) => ({
          ...prev,
          events: prev.events?.map((ev) =>
            ev.id === newItem.id ? newItem : ev
          ),
        }));
    },
    (e) =>
      toast.error(
        (e as Error).message || 'Failed to update training component time'
      )
  );
}
