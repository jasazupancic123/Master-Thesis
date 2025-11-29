import { alpha, Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { theme } from '@/app/style';
import { useDashboard } from '@/store/dashboard.provider';
import { AnimatedLinearProgress } from '@/ui/animated-linear-progress';
import { useMain } from '@/store/main.provider';
import useDashboardCycles from './hooks/use-cycles.hook';

export default function CycleProgress() {
  const mainContext = useMain();
  const dashboardContext = useDashboard();

  const selectedGroups = dashboardContext
    ? dashboardContext.selectedGroups
    : mainContext.groups;

  const { cyclesWithProgress } = useDashboardCycles(selectedGroups);

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      sx={{ p: 1 }}
      gap={2}
    >
      {cyclesWithProgress.map((cycle) => {
        const group = selectedGroups.find((g) => g.id === cycle.groupId);

        return (
          <Box
            key={cycle.id}
            width="100%"
            display="flex"
            flexDirection="column"
            sx={{
              borderRadius: 2,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {group ? group.name : 'Unknown group'}
              </Typography>
              <Typography variant="subtitle2" fontWeight={600}>
                {cycle.name}
              </Typography>
            </Box>

            <Box mt={1}>
              <AnimatedLinearProgress
                variant="determinate"
                targetValue={cycle.progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.075),
                }}
              />
              <Box mt={0.5} display="flex" justifyContent="space-between">
                <Typography variant="caption">
                  {dayjs(cycle.from).format('DD.MM.YYYY')}
                </Typography>
                <Typography variant="caption">
                  {dayjs(cycle.to).format('DD.MM.YYYY')}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
