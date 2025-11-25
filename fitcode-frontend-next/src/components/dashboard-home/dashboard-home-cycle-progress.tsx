import { theme } from '@/app/style';
import { Cycle } from '@/core/institution/type/cycle.type';
import { useDashboard } from '@/store/dashboard.provider';
import { AnimatedLinearProgress } from '@/ui/animated-linear-progress';
import { alpha, Box, LinearProgress, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

export default function DashboardHomeCycleProgress() {
  const { selectedGroups } = useDashboard();

  const [cycles, setCycles] = useState<(Cycle & { groupId: string })[]>([]);

  useEffect(() => {
    const currentCycles: (Cycle & { groupId: string })[] = [];

    selectedGroups.forEach((group) => {
      const cycle = group.cycles.find(
        (c) => dayjs(c.from).isBefore(dayjs()) && dayjs(c.to).isAfter(dayjs())
      );

      if (cycle) {
        currentCycles.push({ ...cycle, groupId: group.id });
      }
    });

    setCycles(currentCycles);
  }, [selectedGroups]);

  const cyclesWithProgress = useMemo(
    () =>
      cycles.map((cycle) => {
        const total = dayjs(cycle.to).diff(dayjs(cycle.from), 'day');
        const elapsed = dayjs().diff(dayjs(cycle.from), 'day');
        const progress =
          total <= 0 ? 0 : Math.min(100, Math.max(0, (elapsed / total) * 100));

        return { ...cycle, progress };
      }),
    [cycles]
  );

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
