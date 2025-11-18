import dayjs from 'dayjs';

import type { Group } from '@/core/group/type/group.type';
import type { GroupEvent } from '@/core/group/type/group-event.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponentWithTrainingId } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';

export const getAmPmItems = (
  date: Date,
  state: {
    trainings: Training[];
    group: Group;
  }
): {
  amItems: (TrainingComponentWithTrainingId | GroupEvent)[];
  pmItems: (TrainingComponentWithTrainingId | GroupEvent)[];
} => {
  const { group, trainings } = state;
  const day = dayjs(date);

  const filteredItems: (TrainingComponentWithTrainingId | GroupEvent)[] = [
    ...trainings
      .map((t) => t.components.map((c) => ({ ...c, trainingId: t.id })))
      .flat(),
    ...(group.events || []),
  ].filter((t) => lib.common.date.isBetween(day, dayjs(t.from), dayjs(t.to)));

  if (!filteredItems.length) return { amItems: [], pmItems: [] };

  const amItems = filteredItems
    .filter((t) => dayjs(t.from).hour() < 12)
    .sort((a, b) => dayjs(a.from).valueOf() - dayjs(b.from).valueOf());
  const pmItems = filteredItems
    .filter((t) => dayjs(t.from).hour() >= 12)
    .sort((a, b) => dayjs(a.from).valueOf() - dayjs(b.from).valueOf());

  return { amItems, pmItems };
};
