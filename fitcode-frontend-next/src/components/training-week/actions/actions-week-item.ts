import toast from 'react-hot-toast';

import type { GroupEvent } from '@/core/group/type/group-event.type';
import { TrainingController } from '@/core/training/training.controller';
import type { TrainingComponentWithTrainingId } from '@/core/training/type/training-component.type';
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
  },
  groupCtx: IGroupCtx
) {
  const {
    item,
    newItem,
    selectedItem,
    setSelectedItem,
    checkIsTrainingComponent,
  } = input;

  const { setTrainings, setGroup } = groupCtx;
  if (!checkIsTrainingComponent(item) || !selectedItem) return;

  try {
    const result = await TrainingController.getInstance().updateComponentTime(
      item.trainingId,
      selectedItem.id,
      { from: newItem.from, to: newItem.to }
    );

    setSelectedItem((prev) => (prev ? newItem : null));
    if (checkIsTrainingComponent(newItem))
      setTrainings((prev) =>
        prev.map((t) =>
          t.id === item.trainingId
            ? {
                ...t,
                from: result.from || t.from,
                to: result.to || t.to,
                components: result.components
                  ? result.components.map((c) => {
                      const found = t.components.find((tc) => tc.id === c.id)!;
                      return { ...found, from: c.from, to: c.to };
                    })
                  : t.components,
              }
            : t
        )
      );
    else
      setGroup((prev) => ({
        ...prev,
        events: prev.events?.map((ev) => (ev.id === newItem.id ? newItem : ev)),
      }));
  } catch (e: unknown) {
    toast.error(
      (e as Error).message || 'Failed to update training component time'
    );
  }
}
