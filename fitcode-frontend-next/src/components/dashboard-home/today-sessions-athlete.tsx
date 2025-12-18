import { Box } from '@mui/material';
import dayjs from 'dayjs';

import TodaySessionsComponent from './today-sessions-component';
import type { Group } from '@/core/institution/type/group.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import useTodaysComponents from './hooks/use-todays-components';

interface Props {
  trainings: Training[];
  activeComponent?: (TrainingComponent & { trainingId?: string }) | null;
}

export default function TodaySessionsAthlete(props: Props) {
  const { institution } = useMain();
  const dashboardContext = useDashboard();

  const groups: Group[] | null = dashboardContext
    ? dashboardContext.filteredGroups
    : null;

  const { trainings, activeComponent } = props;

  const { todayComponents } = useTodaysComponents(groups, trainings);

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
