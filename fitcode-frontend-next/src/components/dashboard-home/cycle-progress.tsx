import { alpha, Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import useDashboardCycles from './hooks/use-cycles.hook';
import { theme } from '@/app/style';
import { useMain } from '@/store/main.provider';
import { AnimatedLinearProgress } from '@/ui/animated-linear-progress';
import { useDashboard } from '@/store/dashboard.provider';

export default function CycleProgress() {
  const dashboardContext = useDashboard();

  const groups = dashboardContext ? dashboardContext.filteredGroups : [];

  const { cyclesWithProgress } = useDashboardCycles(groups);

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      sx={{ p: 1 }}
      gap={2}
    >
      {cyclesWithProgress.map((cycle) => {
        const group = groups.find((g) => g.id === cycle.groupId);

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
