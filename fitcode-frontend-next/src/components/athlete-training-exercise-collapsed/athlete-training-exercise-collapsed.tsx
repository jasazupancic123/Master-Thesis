import { TrainingExercise } from '@/controller/training/type/training-plan.type';
import { Box, Stack, Typography } from '@mui/material';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTheme } from '@mui/material';

interface AthleteTrainingExerciseCollapsedProps {
  exercise: TrainingExercise;
}

export default function AthleteTrainingExerciseCollapsed(
  props: AthleteTrainingExerciseCollapsedProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { exercise } = props;

  return (
    <Stack
      p={1}
      px={screenSize.isMobile ? 0 : undefined}
      pb={1}
      gap={1}
      sx={{
        width: '100% !important',
        position: 'relative',
        backgroundColor: theme.palette.background.default,
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
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.palette.background.dark,
          zIndex: 0,
          opacity: 100,
        }}
      />

      <Stack direction="row" justifyContent="center" sx={{ mt: 0 }}>
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
      </Stack>
    </Stack>
  );
}
