'use client';

import { Box } from '@mui/material';
import '@mediapipe/pose';

export default function MediapipePoseDetection() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center">
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
