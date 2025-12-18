import dayjs from 'dayjs';

import type { Group } from '@/core/institution/type/group.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';

export default function useTodaysComponents(
  groups: Group[] | null,
  trainings: Training[],
  date?: Date
) {
  const todayComponents: (TrainingComponent & {
    groupId: string | undefined;
    trainingId: string;
  })[] = (
    groups === null // for athlete view, show all trainings
      ? trainings
      : trainings.filter((training) =>
          groups.some((group) => group.id === training.groupId)
        )
  )
    .filter((t) => dayjs(t.from).isSame(date ? date : dayjs(), 'day'))
    .flatMap((training) =>
      training.components.map((component) => ({
        ...component,
        groupId: training.groupId,
        trainingId: training.id,
      }))
    )
    .sort((a, b) => dayjs(a.from).diff(dayjs(b.from)));

  return { todayComponents };
}
