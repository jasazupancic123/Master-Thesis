import { useCoachTrainingStation } from '@/store/coach-training-station.provider';
import { AnimatedLinearProgress } from '@/ui/animated-linear-progress';
import { alpha, Box, Button, Typography } from '@mui/material';

export default function TrainingStationHeader() {
  const { station, individualTrainings, component, workloads } =
    useCoachTrainingStation();

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
