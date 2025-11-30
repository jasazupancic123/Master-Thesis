import { Box, Grid2, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { useCoachTraining } from '@/store/coach-training.provider';

export default function TrainingPreviewInfoHeader() {
  const { training, group } = useCoachTraining();

  const numExercises = training.components.reduce(
    (total, component) =>
      total + (component.supersets.flatMap((s) => s.exercises).length || 0),
    0
  );

  return (
    <Box width="100%" display="flex">
      <Grid2 width="50%" container spacing={2} sx={{ mx: 'auto' }}>
        <Grid2
          size={6}
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
        >
          <Typography variant="h5" fontWeight="bold">
            {group.name}
          </Typography>
          <Typography>
            {dayjs(training.from).format('DD MMM, HH:mm')}
          </Typography>
        </Grid2>
        <Grid2
          size={6}
          display="flex"
          flexDirection="column"
          alignItems="flex-end"
        >
          <Typography variant="h5" fontWeight="bold">
            {training.components.length}{' '}
            {training.components.length === 1 ? 'component' : 'components'}
          </Typography>
          <Typography>
            {numExercises} {numExercises === 1 ? 'exercise' : 'exercises'}
          </Typography>
        </Grid2>
      </Grid2>
    </Box>
  );
}
