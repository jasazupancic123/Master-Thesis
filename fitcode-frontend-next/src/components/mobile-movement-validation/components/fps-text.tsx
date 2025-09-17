import { Box, Typography } from '@mui/material';

interface FpsTextProps {
  fps: number | null;
  avgFps: { value: number; count: number } | null;
}

export default function FpsText(props: FpsTextProps) {
  const { fps, avgFps } = props;
  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start">
      <Typography
        variant="caption"
        sx={{
          color: 'white',
          textShadow: '1px 1px 2px black',
        }}
      >
        {fps} FPS
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'white',
          textShadow: '1px 1px 2px black',
        }}
      >
        {avgFps?.value.toFixed(0)} AVG
      </Typography>
    </Box>
  );
}
