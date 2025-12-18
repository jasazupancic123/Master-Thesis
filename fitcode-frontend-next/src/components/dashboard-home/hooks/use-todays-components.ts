import { Group } from '@/core/institution/type/group.type';
import { TrainingComponent } from '@/core/training/type/training-component.type';
import { Training } from '@/core/training/type/training.type';
import dayjs from 'dayjs';

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
