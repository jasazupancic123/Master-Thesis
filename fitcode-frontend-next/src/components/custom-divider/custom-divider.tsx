import { Box } from '@mui/material';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import { useTheme } from '@mui/material';

export default function CustomDivider() {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      maxWidth={MAX_WIDTH}
      sx={{
        mx: 'auto',
      }}
    >
      <Box
        width="100%"
        sx={{
          backgroundColor: theme.palette.background.dark,
          height: '5px',
        }}
      />
    </Box>
  );
}
