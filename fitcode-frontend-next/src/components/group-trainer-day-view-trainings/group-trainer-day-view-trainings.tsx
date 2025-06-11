import TrainingCard from '@/components/training-card/training-card';
import { Training } from '@/controller/training/type/training.type';
import { useGroup } from '@/store/group-provider';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { Day } from '@/common/service/util/date.util';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import React from 'react';

interface GroupTrainerDayViewTrainingsProps {
  day: Day;
  amTraining: Training | undefined;
  pmTraining: Training | undefined;
  loading: boolean;
}

export default function GroupTrainerDayViewTrainings(
  props: GroupTrainerDayViewTrainingsProps
) {
  const { day, amTraining, pmTraining, loading } = props;

  const { cycle } = useGroup();

  return !cycle ? (
    <Box
      display="flex"
      bgcolor={'background.paper'}
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
    >
      {/* Training set groups with set exercises */}
      {!loading && !amTraining && !pmTraining ? (
        <Box
          display="flex"
          bgcolor={'background.paper'}
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
        <>
          {amTraining && (
            <TrainingCard day={day} training={amTraining} period="AM" />
          )}

          {pmTraining && (
            <TrainingCard day={day} training={pmTraining} period="PM" />
          )}
        </>
      )}
    </Box>
  );
}
