import {
  CheckCircle,
  Close,
  Error,
  FontDownload,
  FontDownloadOff,
  MoreVert,
  SettingsOutlined,
  Warning,
} from '@mui/icons-material';
import { alpha, Box, Button, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

import { UserStatusesEvaluation } from './enum/user-statuses-evaluation';
import { theme } from '@/app/style';
import { useCoachTrainingStation } from '@/store/training-station.provider';
import { AnimatedLinearProgress } from '@/ui/animated-linear-progress';
import { SetState } from '@/lib/common/type/state.type';
import { useRouter } from 'next/navigation';
import { useCoachTraining } from '@/store/coach-training.provider';

interface Props {
  displayUserNames: boolean;
  setDisplayUserNames: SetState<boolean>;
  setOpenNewStationModal: SetState<boolean>;
}

export default function TrainingStationHeader(props: Props) {
  const router = useRouter();

  const { training: globalTraining } = useCoachTraining();
  const {
    station,
    individualTrainings,
    component,
    workloads,
    userStatusesValidation,
  } = useCoachTrainingStation();

  const { displayUserNames, setDisplayUserNames, setOpenNewStationModal } =
    props;

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
    (w) =>
      station.users.some((u) => u.uid === w.userId) &&
      station.exercises.some((e) => e.id === w.exerciseId) &&
      w.id !== undefined
  ).length;

  return (
    <Box
      width={360}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      {/* User Statuses Info */}
      {showStatusInfo && (
        <Box
          width="100%"
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
            sx={{ m: 0, position: 'absolute', top: 4, right: 4 }}
            onClick={() => setShowStatusInfo(false)}
          >
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}

      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        justifyContent="center"
        flex={1}
      >
        <Box
          width={360}
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
          gap={1}
        >
          <Typography
            fontSize={12}
            maxWidth="80%"
            textAlign="start"
            lineHeight={1.6}
            sx={{ color: station.color, fontWeight: 'bold' }}
          >
            Training Station
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              if (
                !component ||
                globalTraining.groupId === undefined ||
                globalTraining.id === undefined
              )
                return;

              router.push(
                `/groups/${globalTraining.groupId}?training=${globalTraining.id}&component=${component.id}`
              );
            }}
            sx={{
              height: 18,
              minWidth: 100,
              backgroundColor: theme.palette.background.dark,
              color: theme.palette.text.primary,
              fontSize: 12,
              p: '0px !important',
            }}
          >
            Training Plan
          </Button>
        </Box>
        <Box width={360} display="flex" justifyContent="space-between" gap={1}>
          <Typography variant="h4" textAlign="start">
            {station.name}
          </Typography>
          <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="flex-start"
            gap={0.5}
            mt={1}
          >
            <IconButton
              onClick={() => setDisplayUserNames((prev) => !prev)}
              sx={{ p: 0, m: 0 }}
            >
              {displayUserNames ? <FontDownload /> : <FontDownloadOff />}
            </IconButton>
            <Button
              variant="contained"
              onClick={() => setOpenNewStationModal(true)}
              sx={{
                height: 24,
                minWidth: 46,
                backgroundColor: theme.palette.background.dark,
                color: theme.palette.text.primary,
                fontSize: 12,
                p: '0px !important',
              }}
            >
              New
            </Button>
          </Box>
        </Box>
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
          width:
            typeof window !== 'undefined'
              ? Math.min(window.innerWidth * 0.8, 360)
              : 360,
          height: 10,
          borderRadius: 5,
          backgroundColor: alpha(station.color, 0.075),
          color: station.color,
        }}
      />
    </Box>
  );
}
