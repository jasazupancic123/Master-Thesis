import dayjs from 'dayjs';

import type { CommonService } from '@/common/service/common.service';
import type { Group } from '@/controller/group/type/group.type';
import type { GroupEvent } from '@/controller/group/type/group-event.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponentWithTrainingId } from '@/controller/training/type/training-component.type';

export const getAmPmItems = (
  date: Date,
  state: {
    trainings: Training[];
    commonService: CommonService;
    group: Group;
  }
): {
  amItems: (TrainingComponentWithTrainingId | GroupEvent)[];
  pmItems: (TrainingComponentWithTrainingId | GroupEvent)[];
} => {
  const { group, trainings, commonService } = state;

  const day = dayjs(date);
  const filteredItems: (TrainingComponentWithTrainingId | GroupEvent)[] = [
    ...trainings
      .map((t) => t.components.map((c) => ({ ...c, trainingId: t.id })))
      .flat(),
    ...(group.events || []),
  ].filter((t) =>
    commonService.date.isBetween(day, dayjs(t.from), dayjs(t.to))
  );

  if (!filteredItems.length) return { amItems: [], pmItems: [] };

  const amItems = filteredItems
    .filter((t) => dayjs(t.from).hour() < 12)
    .sort((a, b) => dayjs(a.from).valueOf() - dayjs(b.from).valueOf());
  const pmItems = filteredItems
    .filter((t) => dayjs(t.from).hour() >= 12)
    .sort((a, b) => dayjs(a.from).valueOf() - dayjs(b.from).valueOf());

  return { amItems, pmItems };
};
