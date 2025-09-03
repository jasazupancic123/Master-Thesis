import dayjs from 'dayjs';

import type { Group } from '@/controller/group/type/group.type';
import type { GroupEvent } from '@/controller/group/type/group-event.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';

export const isOverlaping = (
  passedItem: TrainingComponent | GroupEvent,
  state: {
    trainings: Training[];
    group: Group;
  }
): boolean => {
  const { trainings, group } = state;

  const from = dayjs(passedItem.from);
  const to = dayjs(passedItem.to);

  const items = [
    ...trainings.flatMap((t) => t.components || []),
    ...(group.events || []),
  ].flat();

  const isOverlap = items.some((loopedItem) => {
    if (loopedItem.id === passedItem.id) return;
    if (
      (from.isAfter(loopedItem.from) && from.isBefore(loopedItem.to)) ||
      (to.isAfter(loopedItem.from) && to.isBefore(loopedItem.to)) ||
      (dayjs(loopedItem.from).isAfter(from) &&
        dayjs(loopedItem.from).isBefore(to)) ||
      (dayjs(loopedItem.to).isAfter(from) && dayjs(loopedItem.to).isBefore(to))
    ) {
      return true;
    }

    return false;
  });

  return isOverlap;
};
