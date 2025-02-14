'use client';

import { CommonService } from '@/common/service/common.service';
import { Box, Typography, IconButton } from '@mui/material';
import Subgroups from './subgroups';
import { TrainingCardProps } from './type';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
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
    selectedDailyTraining,
    setSelectedDailyTraining,
  } = props;

  const handleChangeDailyTraining = () => {
    if (period === 'AM')
      setSelectedDailyTraining((prev) => ({ ...prev, am: !prev.am }));
    else setSelectedDailyTraining((prev) => ({ ...prev, pm: !prev.pm }));
  };

  return (
    <Box width="100%">
      <Box display="flex" mt={2}>
        <Box
          display="flex"
          width="17.5%"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            backgroundColor: '#005D57',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
          p={0}
        >
          <Box
            p={2}
            sx={{
              backgroundColor: 'background.paper',
              borderTopLeftRadius: 10,
            }}
          />
          <Typography variant="caption">{period}</Typography>

          <Typography variant="caption">
            {commonService.date.format(day.date)}
          </Typography>

          <Typography variant="caption">
            {commonService.date.formatTime(training.from)}:
            {commonService.date.formatTime(training.to)}
          </Typography>

          <IconButton
            onClick={() => {
              handleChangeDailyTraining();
            }}
            sx={{ p: 0, pr: 1 }}
          >
            {(period === 'AM' && selectedDailyTraining.am) ||
            (period === 'PM' && selectedDailyTraining.pm) ? (
              <VisibilityOffIcon />
            ) : (
              <VisibilityIcon />
            )}
          </IconButton>
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
          display:
            (period === 'AM' && !selectedDailyTraining.am) ||
            (period === 'PM' && !selectedDailyTraining.pm)
              ? 'none'
              : undefined,
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
