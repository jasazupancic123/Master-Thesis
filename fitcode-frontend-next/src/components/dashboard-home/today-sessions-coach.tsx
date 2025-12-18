import { Box } from '@mui/material';

import useTodaysComponents from './hooks/use-todays-components';
import TrainingComponentDashboardCard from './training-component-dashboard-card';
import type { Training } from '@/core/training/type/training.type';
import { useDashboard } from '@/store/dashboard.provider';

interface Props {
  trainings: Training[];
}

export default function TodaySessionsCoach(props: Props) {
  const { filteredGroups } = useDashboard();

  const { trainings } = props;

  const { todayComponents } = useTodaysComponents(
    filteredGroups || [],
    trainings
  );

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={1}>
      {todayComponents.map((component, i) => {
        return <TrainingComponentDashboardCard key={i} component={component} />;
      })}
    </Box>
  );
}
