import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React from 'react';

import TrainingCard from '@/components/training-card/training-card';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

interface GroupTrainerDayViewTrainingsProps {
  loading: boolean;
}

export default function GroupTrainerDayViewTrainings(
  props: GroupTrainerDayViewTrainingsProps
) {
  const { loading } = props;

  const { cycle } = useGroup();
  const { day, training } = useTrainerDayViewContext();

  return !cycle ? (
    <Box
      display="flex"
      width="100%"
      p={2}
      justifyContent="center"
      sx={{
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
      }}
    >
      <Typography variant="h6" mb={2}>
        Select a cycle in cycle view
      </Typography>
    </Box>
  ) : (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width="100%"
      sx={{
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
      }}
      gap={2}
      px={1}
    >
      {/* Training set groups with set exercises */}
      {!loading && !training ? (
        <Box
          display="flex"
          width="100%"
          p={2}
          justifyContent="center"
          sx={{
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
          }}
        >
          <Typography variant="h6" mb={2}>
            No session for current date
          </Typography>
        </Box>
      ) : (
        <Box width="100%">
          {training && <TrainingCard key={training.id} day={day} />}
        </Box>
      )}
    </Box>
  );
}
