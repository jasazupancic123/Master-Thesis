import { Box } from '@mui/material';
import dayjs from 'dayjs';

import TodaySessionsComponent from './today-sessions-component';
import type { Group } from '@/core/institution/type/group.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';

interface Props {
  trainings: Training[];
  activeComponent?: (TrainingComponent & { trainingId?: string }) | null;
}

export default function TodaySessions(props: Props) {
  const dashboardContext = useDashboard();

  const selectedGroups: Group[] | null = dashboardContext
    ? dashboardContext.selectedGroups
    : null;

  const { trainings, activeComponent } = props;

  const todayComponents: (TrainingComponent & {
    groupId: string | undefined;
    trainingId: string;
  })[] = (
    selectedGroups === null // for athlete view, show all trainings
      ? trainings
      : trainings.filter((training) =>
          selectedGroups.some((group) => group.id === training.groupId)
        )
  )
    .filter((t) => dayjs(t.from).isSame(dayjs(), 'day'))
    .flatMap((training) =>
      training.components.map((component) => ({
        ...component,
        groupId: training.groupId,
        trainingId: training.id,
      }))
    );

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={2}>
      {todayComponents.map((component, i) => {
        if (
          activeComponent &&
          activeComponent.id === component.id &&
          activeComponent.trainingId === component.trainingId
        )
          return null;

        return (
          <TodaySessionsComponent
            key={`${component.id}-${i}`}
            component={component}
            trainings={trainings}
            index={i}
          />
        );
      })}
    </Box>
  );
}
