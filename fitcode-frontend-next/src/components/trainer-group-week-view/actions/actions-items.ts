import { CommonService } from '@/common/service/common.service';
import { GroupEvent } from '@/controller/group/type/group-event.type';
import { Group } from '@/controller/group/type/group.type';
import { TrainingComponentWithTrainingId } from '@/controller/training/type/training-component.type';
import { Training } from '@/controller/training/type/training.type';
import dayjs from 'dayjs';

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
