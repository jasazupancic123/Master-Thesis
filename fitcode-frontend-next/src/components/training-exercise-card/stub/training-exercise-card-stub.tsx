import { Box, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import StubTrainingExerciseCardCollapsedSets from '../components/training-exercise-card-sets/components/training-exercise-card-sets-collapsed/training-exercise-card-collapsed-sets-stub';
import type { TrainingExerciseCardProps } from '@/components/trainer-group-day-view/props/props';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function StubTrainingExerciseCard(
  props: Pick<TrainingExerciseCardProps, 'exercise'> & {
    expandedExercisesView: boolean;
  }
) {
  const screenSize = useScreenSize();
  const theme = useTheme();

  const { training, component } = useTrainerDayViewContext();

  const { selectedExercises } = useTrainerDayViewContext();

  const { exercise, expandedExercisesView } = props;

  const [expandedSetsView, setExpandedSetsView] = useState(false);

  const componentIndex = training?.components.findIndex(
    (c) => c.id === component?.id
  );

  if (!training || !component) return null;

  return (
    <Stack
      p={1}
      px={screenSize.isMobile ? 0 : undefined}
      pb={1}
      gap={1}
      sx={{
        width: '100% !important',
        position: 'relative',
        borderRadius: '5px',
        backgroundPosition: 'center',
        backgroundSize: '100% auto',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      {/* Background Overlay */}
      <Box
        sx={{
          width: '100% !important',
          cursor: 'pointer',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: selectedExercises.some((ex) => ex.id === exercise.id)
            ? theme.palette.background.light
            : theme.palette.background.dark,
          zIndex: 0,
        }}
      />

      <Stack direction="row" justifyContent="center" sx={{ mt: 0 }}>
        <Tooltip title={exercise.exercise?.name} placement="top">
          <Typography
            variant="body1"
            fontWeight={700}
            fontSize={12}
            textTransform="uppercase"
            color={theme.palette.text.primary}
            sx={{
              textAlign: 'center',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '75%',
              zIndex: 1,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
          >
            {exercise.exercise?.name}
          </Typography>
        </Tooltip>
      </Stack>

      {expandedExercisesView && (
        <StubTrainingExerciseCardCollapsedSets
          component={component}
          exercise={exercise}
          expandedSetsView={expandedSetsView}
          setExpandedSetsView={setExpandedSetsView}
          componentIndex={componentIndex}
        />
      )}
    </Stack>
  );
}
