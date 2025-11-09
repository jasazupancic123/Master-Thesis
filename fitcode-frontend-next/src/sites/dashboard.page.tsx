'use client';

import { Typography } from '@mui/material';
import { Box } from '@mui/material';

import DashboardTrainingPlan from '@/components/dashboard/dashboard-training-plan';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function DashboardPage() {
  const { profile } = useMain();

  const { institutions, selectedInstitution } = useDashboard();

  if (!profile) return null;

  if (!institutions.length)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Typography variant="h6">No institutions available</Typography>
      </Box>
    );

  if (!selectedInstitution)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Typography variant="h6">No institution selected</Typography>
      </Box>
    );

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          mb: 5,
        }}
      >
        <DashboardTrainingPlan />
      </Box>
    </>
  );
}
