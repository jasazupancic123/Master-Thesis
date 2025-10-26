import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import type { RefObject } from 'react';

import { DetectionStatus } from '@/lib/pose-detection/enum/detection-status';

interface MovementValidationHeaderProps {
  statusRef: RefObject<DetectionStatus>;
  statusMessage: string;
  defaultExerciseName: string;
  countdownValue: number | null;
}

export default function MovementValidationHeader(
  props: MovementValidationHeaderProps
) {
  const theme = useTheme();

  const { statusRef, statusMessage, countdownValue, defaultExerciseName } =
    props;

  return (
    <Box
      width="100%"
      height={50}
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        p: 1,
        zIndex: 100,
        opacity: 0.8,
      }}
    >
      <Typography
        textAlign="center"
        fontSize={40}
        fontWeight={800}
        sx={{
          textTransform: 'uppercase',
          textShadow: [
            DetectionStatus.RECORDING,
            DetectionStatus.READY,
          ].includes(statusRef.current)
            ? undefined
            : `4px 4px 8px ${theme.palette.background.paper}`,
          color: `${[DetectionStatus.RECORDING, DetectionStatus.READY].includes(statusRef.current) ? theme.palette.background.default : theme.palette.primary.main}`,
          userSelect: 'none',
          border: `1px solid ${[DetectionStatus.RECORDING, DetectionStatus.READY].includes(statusRef.current) ? theme.palette.background.default : theme.palette.primary.main}`,
          backgroundColor: [
            DetectionStatus.RECORDING,
            DetectionStatus.READY,
          ].includes(statusRef.current)
            ? theme.palette.primary.main
            : theme.palette.background.default,
          borderRadius: 8,
          p: 2,
          py: 1,
        }}
      >
        {statusMessage}
        {statusRef.current === DetectionStatus.NOT_STILL && (
          <> for {defaultExerciseName}</>
        )}
        {countdownValue && (
          <>
            <br />
            {countdownValue}
          </>
        )}
      </Typography>
    </Box>
  );
}
