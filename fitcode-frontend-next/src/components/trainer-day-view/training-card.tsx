'use client';

import { CommonService } from '@/common/service/common.service';
import { Box, Typography, IconButton } from '@mui/material';
import Subgroups from './subgroups';
import { TrainingCardProps } from './type';
import TrainingComponentCard from './training-component';

const commonService = CommonService.instance;

export default function TrainingCard(props: TrainingCardProps) {
  const {
    token,
    setSelectedTrainings,
    users,
    filteredExercises,
    setFilteredExercises,
    components,
    training,
    exercises,
    period,
    day,
  } = props;

  return (
    <Box width="100%">
      <Box display="flex" mt={2}>
        <Box
          display="flex"
          width="wrap"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            backgroundColor: '#005D57',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
          p={0}
        >
          <Box
            p={2}
            mr={1}
            sx={{
              backgroundColor: 'background.paper',
              borderTopLeftRadius: 10,
            }}
          />
          <Typography variant="caption" sx={{ mx: 1 }}>
            {period}
          </Typography>

          <Typography variant="caption" sx={{ mx: 1 }}>
            {commonService.date.format(day.date)}
          </Typography>

          <Typography variant="caption" sx={{ mx: 1 }}>
            {commonService.date.formatTime(training.from)}:
            {commonService.date.formatTime(training.to)}
          </Typography>
        </Box>
      </Box>

      <Box
        key={training.id}
        sx={{
          border: '1px solidrgb(36, 38, 46)',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          backgroundColor: 'background.paper',
          p: 1,
          mt: 0,
        }}
      >
        <Typography variant="h6" p={1}>
          Training ({commonService.date.formatTime(training.from)} -{' '}
          {commonService.date.formatTime(training.to)})
        </Typography>
        <Subgroups
          token={token}
          training={training}
          setTrainings={setSelectedTrainings}
          users={users}
        />

        {Object.values(training.components || {})?.map((component, i) => (
          <TrainingComponentCard
            key={i}
            token={token}
            training={training}
            component={component}
            components={components}
            exercises={exercises}
            setSelectedTrainings={setSelectedTrainings}
            filteredExercises={filteredExercises}
            setFilteredExercises={setFilteredExercises}
            i={i}
          />
        ))}
      </Box>
    </Box>
  );
}
