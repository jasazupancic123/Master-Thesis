'use client';

import { Box } from '@mui/material';

import { useAthlete } from '@/store/athlete.provider';
import DashboardHome from '@/components/dashboard-home/dashboard-home';

export default function AthleteHomePage() {
  const { trainings } = useAthlete();

  return (
    <Box display="flex" flexDirection="column" width="100%" sx={{ p: 1 }}>
      <DashboardHome trainings={trainings} />
    </Box>
  );
}
