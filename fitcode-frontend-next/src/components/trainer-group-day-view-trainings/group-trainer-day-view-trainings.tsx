import TrainingCard from '@/components/training-card/training-card';
import { useGroup } from '@/store/group-provider';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { Day } from '@/common/service/util/date.util';
import dayjs from 'dayjs';
import React from 'react';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface GroupTrainerDayViewTrainingsProps {
  day: Day;
  loading: boolean;
}

export default function GroupTrainerDayViewTrainings(
  props: GroupTrainerDayViewTrainingsProps
) {
  const { day, loading } = props;

  const { cycle } = useGroup();
  const { todaysTrainings } = useTrainerDayViewContext();

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
        Select a cycle
      </Typography>
    </Box>
  ) : (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width="100%"
      pb={15}
      sx={{
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
      }}
      gap={2}
      mt={0.5}
      px={1}
    >
      {/* Training set groups with set exercises */}
      {!loading && !todaysTrainings.length ? (
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
        todaysTrainings.map((training) => {
          const period = dayjs(training.from).hour() < 12 ? 'AM' : 'PM';
          return (
            <TrainingCard
              key={training.id}
              day={day}
              training={training}
              period={period}
            />
          );
        })
      )}
    </Box>
  );
}
