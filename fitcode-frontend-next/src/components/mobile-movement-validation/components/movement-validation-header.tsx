import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

interface MovementValidationHeaderProps {
  statusMessage: string;
}

export default function MovementValidationHeader(
  props: MovementValidationHeaderProps
) {
  const theme = useTheme();
  const { statusMessage } = props;

  return (
    <Box
      width="100%"
      height={150}
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.background.default,
        p: 1,
      }}
    >
      <Typography
        textAlign="center"
        fontSize={40}
        sx={{ textTransform: 'uppercase' }}
      >
        {statusMessage}
      </Typography>
    </Box>
  );
}
