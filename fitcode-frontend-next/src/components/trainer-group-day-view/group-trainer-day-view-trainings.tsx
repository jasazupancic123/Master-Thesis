import { Event } from '@mui/icons-material';
import type { SxProps } from '@mui/material';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React from 'react';

import { theme } from '@/app/style';
import TrainingCard from '@/components/training-card/training-card';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import AlertFrame from '@/ui/alert-frame';

const sx: SxProps = {
  borderBottomRightRadius: 10,
  borderBottomLeftRadius: 10,
};

export default function GroupTrainerDayViewTrainings() {
  const { cycle } = useGroup();
  const { loading, training } = useTrainerDayView();

  return !cycle ? (
    <Box display="flex" width="100%" p={2} justifyContent="center" sx={sx}>
      <Typography variant="h6" mb={2}>
        Select a phase in phase view.
      </Typography>
    </Box>
  ) : (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width="100%"
      sx={sx}
      gap={2}
      px={1}
    >
      {/* Training set groups with set exercises */}
      {!loading && !training ? (
        <Box display="flex" width="100%" p={2} justifyContent="center" sx={sx}>
          <Typography variant="h6" mb={2}>
            No session for current date
          </Typography>
        </Box>
      ) : (
        <Box width="100%">{training && <TrainingCard key={training.id} />}</Box>
      )}
    </Box>
  );
}
