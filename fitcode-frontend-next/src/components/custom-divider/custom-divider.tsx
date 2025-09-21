import { Box } from '@mui/material';
import { useTheme } from '@mui/material';

export default function CustomDivider() {
  const theme = useTheme();

  return (
    <Box
      width="100%"
      sx={{
        backgroundColor: theme.palette.primary.main,
        height: '3px',
      }}
    />
  );
}
