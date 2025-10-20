import { KeyboardArrowRight } from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';

interface AthleteTrainingExerciseCollapsedProps {
  exercise: TrainingExercise;
  borderTopRadius: boolean;
  borderBottomRadius: boolean;
  expandedSetsView: boolean;
  displaySetsArrow: boolean;
  setExpandedSetsView: SetState<boolean>;
}

export default function AthleteTrainingExerciseCollapsed(
  props: AthleteTrainingExerciseCollapsedProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    exercise,
    borderTopRadius,
    borderBottomRadius,
    expandedSetsView,
    displaySetsArrow,
    setExpandedSetsView,
  } = props;

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
        borderTopRightRadius: borderTopRadius ? '5px' : 0,
        borderTopLeftRadius: borderTopRadius ? '5px' : 0,
        borderBottomRightRadius: borderBottomRadius ? '5px' : 0,
        borderBottomLeftRadius: borderBottomRadius ? '5px' : 0,
      }}
    >
      {displaySetsArrow && (
        <IconButton
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: 0,
            zIndex: 1,
          }}
          disableRipple
          onClick={() => setExpandedSetsView(!expandedSetsView)}
        >
          <KeyboardArrowRight
            sx={{
              transform: expandedSetsView ? 'rotate(90deg)' : 'rotate(180deg)',
              color: 'white',
              fontSize: screenSize.isTablet ? 14 : 16,
              ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
              transition: 'transform 0.3s ease-in-out',
            }}
          />
        </IconButton>
      )}

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
