'use client';

import { Box, IconButton } from '@mui/material';
import '@mediapipe/pose';
import { Close } from '@mui/icons-material';
import { SetState } from '@/common/type/state.type';

interface MediapipePoseDetectionProps {
  setOpenPoseDetection: SetState<boolean>;
}

export default function MediapipePoseDetection(
  props: MediapipePoseDetectionProps
) {
  const { setOpenPoseDetection } = props;

  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <IconButton
        sx={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          cursor: 'pointer',
          zIndex: 1000,
        }}
        onClick={() => setOpenPoseDetection(false)}
      >
        <Close />
      </IconButton>
      <iframe
        src="https://detrack.netlify.app/"
        width={1000}
        height={600}
        style={{ border: 'none', margin: 'auto' }}
        allowFullScreen
        allow="camera; microphone"
      />
    </Box>
  );
}
