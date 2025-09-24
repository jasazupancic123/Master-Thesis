import { Box, CircularProgress, Typography } from '@mui/material';

import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

type Props = {
  trainingMembersLength: number;
  componentId: string;
  supersetIndex: number;
  exerciseId: string;
};

export default function ExerciseMembersInProgress(props: Props) {
  const { componentId, supersetIndex, exerciseId } = props;

  const { users } = useMain();
  const { progress } = useTrainerDayViewContext();

  const exercises = progress.flatMap((p) =>
    p.exercises.map((e) => ({
      userId: p.userId,
      componentId: p.id,
      supersetIndex: e.supersetIndex,
      exerciseId: e.id,
      completedSets: e.completedSets,
    }))
  );

  const membersInProgress = exercises
    .filter(
      (p) =>
        p.componentId === componentId &&
        p.supersetIndex === supersetIndex &&
        p.exerciseId === exerciseId &&
        p.completedSets > 0
    )
    .map((p) => users.find((u) => u.uid === p.userId))
    .filter((u) => u !== undefined);

  return (
    <Box zIndex={0} ml={1}>
      <CircularProgressWithLabel value={50} />
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
