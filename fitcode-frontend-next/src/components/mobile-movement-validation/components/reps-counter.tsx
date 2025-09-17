import { Box, Typography } from '@mui/material';

interface RepsCounterProps {
  reps: number;
}

export default function RepsCounter(props: RepsCounterProps) {
  const { reps } = props;

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start">
      <Typography
        variant="caption"
        fontSize={30}
        sx={{
          color: 'white',
          textShadow: '1px 1px 2px black',
        }}
      >
        Reps: {reps}
      </Typography>
    </Box>
  );
}
