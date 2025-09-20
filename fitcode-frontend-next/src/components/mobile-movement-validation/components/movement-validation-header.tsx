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
        zIndex: 100000,
      }}
    >
      <Typography
        textAlign="center"
        fontSize={40}
        fontWeight={800}
        sx={{
          textTransform: 'uppercase',
          textShadow: `4px 4px 8px ${theme.palette.background.paper}`,
          color: theme.palette.primary.main,
          userSelect: 'none',
        }}
      >
        {statusMessage}
      </Typography>
    </Box>
  );
}
