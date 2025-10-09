import { Box, CircularProgress, Typography } from '@mui/material';

import useExerciseMembersInProgress from './hooks/use-members-in-progress';

export type ExerciseMembersInProgressProps = {
  trainingMembersLength: number;
  componentId: string;
  supersetIndex: number;
  exerciseId: string;
};

export default function ExerciseMembersInProgress(
  props: ExerciseMembersInProgressProps
) {
  const { value } = useExerciseMembersInProgress(props);

  if (value === 0) return null;

  return (
    <Box zIndex={0} ml={1}>
      <CircularProgressWithLabel value={value} />
    </Box>
  );
}

function CircularProgressWithLabel(props: { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} size={16} />

      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          fontSize={6}
          variant="caption"
          component="div"
          sx={{ color: 'primary.main' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}
