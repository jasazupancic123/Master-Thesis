import { CheckCircle, Close, Error, Warning } from '@mui/icons-material';
import { alpha, Box, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

import { UserStatusesEvaluation } from './enum/user-statuses-evaluation';
import { theme } from '@/app/style';
import { useCoachTrainingStation } from '@/store/training-station.provider';
import { AnimatedLinearProgress } from '@/ui/animated-linear-progress';

export default function TrainingStationHeader() {
  const {
    station,
    individualTrainings,
    component,
    workloads,
    userStatusesValidation,
  } = useCoachTrainingStation();

  const [showStatusInfo, setShowStatusInfo] = useState(true);

  if (!station) return null;

  const currentIndividualTrainings = individualTrainings.filter((t) =>
    station.users.some((u) => u.uid === t.userId)
  );

  let prescribedWorkloadsCount = 0;

  currentIndividualTrainings.forEach((training) => {
    const trainingComponent = training.components.find(
      (c) => c.id === component?.id
    );
    if (!trainingComponent) return;

    const trainingExercises = trainingComponent.supersets
      .flatMap((s) => s.exercises)
      .filter((e) => station.exercises.some((se) => se.id === e.id));

    trainingExercises.forEach((exercise) => {
      prescribedWorkloadsCount += exercise.sets.length;
    });
  });

  const completedWorkloads = workloads.filter(
    (w) => station.users.some((u) => u.uid === w.userId) && w.id !== undefined
  ).length;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      {/* User Statuses Info */}
      {showStatusInfo && (
        <Box
          width={300}
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={1}
          sx={{
            backgroundColor: alpha(theme.palette.background.light, 0.5),
            borderRadius: 2,
            p: 1,
            py: 2,
            position: 'relative',
          }}
        >
          {/* Icon */}
          {userStatusesValidation === UserStatusesEvaluation.ALL_IN_PROGRESS ? (
            <CheckCircle sx={{ color: theme.palette.success.main }} />
          ) : userStatusesValidation ===
            UserStatusesEvaluation.NONE_IN_PROGRESS ? (
            <Error sx={{ color: theme.palette.error.main }} />
          ) : userStatusesValidation === UserStatusesEvaluation.MIXED ? (
            <Warning sx={{ color: theme.palette.warning.main }} />
          ) : null}

          {/* Text */}
          <Typography fontSize={14} lineHeight={1} mt={0.25}>
            {userStatusesValidation === UserStatusesEvaluation.ALL_IN_PROGRESS
              ? 'All athletes are in progress'
              : userStatusesValidation ===
                  UserStatusesEvaluation.NONE_IN_PROGRESS
                ? 'No athletes are in progress'
                : userStatusesValidation === UserStatusesEvaluation.MIXED
                  ? 'Some athletes are not in progress'
                  : ''}
          </Typography>

          <IconButton
            sx={{ p: 0, m: 0, position: 'absolute', top: 4, right: 4 }}
            onClick={() => setShowStatusInfo(false)}
          >
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}
      <Box
        width="70%"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography
          fontSize={12}
          maxWidth="80%"
          textAlign="center"
          sx={{ color: station.color, fontWeight: 'bold' }}
        >
          Training Station
        </Typography>
        <Typography variant="h4" textAlign="center">
          {station.name}
        </Typography>
      </Box>
      <Box width="100%" display="flex" justifyContent="center" gap={10}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography fontSize={12} textAlign="center">
            Athletes
          </Typography>
          <Typography
            width={20}
            variant="h5"
            fontWeight={500}
            textAlign="center"
            sx={{ borderBottom: `2px solid ${station.color}` }}
          >
            {station.users.length}
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography fontSize={12} textAlign="center">
            Completed sets
          </Typography>
          <Typography
            variant="h5"
            fontWeight={500}
            textAlign="center"
            sx={{ borderBottom: `2px solid ${station.color}` }}
          >
            {completedWorkloads} / {prescribedWorkloadsCount}
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography fontSize={12} textAlign="center">
            Exercises
          </Typography>
          <Typography
            width={20}
            variant="h5"
            fontWeight={500}
            textAlign="center"
            sx={{ borderBottom: `2px solid ${station.color}` }}
          >
            {station.exercises.length}
          </Typography>
        </Box>
      </Box>
      <AnimatedLinearProgress
        variant="determinate"
        targetValue={(completedWorkloads / prescribedWorkloadsCount) * 100}
        sx={{
          width: 360,
          height: 10,
          borderRadius: 5,
          backgroundColor: alpha(station.color, 0.075),
          color: station.color,
        }}
      />
    </Box>
  );
}
