'use client';

import { Box } from '@mui/material';

import DashboardHome from '@/components/dashboard-home/dashboard-home';

export default function AthleteHomePage() {
  return (
    <Box display="flex" flexDirection="column" width="100%" sx={{ p: 1 }}>
      <DashboardHome />
    </Box>
  );
}
