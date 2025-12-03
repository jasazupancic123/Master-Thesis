import { alpha, Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import { theme } from '@/app/style';
import type { SetState } from '@/lib/common/type/state.type';
import { useCoachTraining } from '@/store/coach-training.provider';
import { useCoachTrainingStation } from '@/store/training-station.provider';
import { AnimatedLinearProgress } from '@/ui/animated-linear-progress';

interface Props {
  setOpenNewStationModal: SetState<boolean>;
}

export default function TrainingStationHeader(props: Props) {
  const router = useRouter();

  const { training: globalTraining } = useCoachTraining();
  const { station, individualTrainings, component, workloads } =
    useCoachTrainingStation();

  const { setOpenNewStationModal } = props;

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
