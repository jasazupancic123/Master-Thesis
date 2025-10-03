import { Box } from '@mui/material';
import { useTheme } from '@mui/material';

import { useScreenSize } from '@/store/screen-size.provider';

export default function SimpleCircle() {
  const theme = useTheme();
  const screenSize = useScreenSize();

  return (
    <Box
      sx={{
        height: 8,
        width: 8,
        borderRadius: '50%',
        backgroundColor: theme.palette.primary.main,
        ml: !screenSize.isDesktop ? 1 : 0,
      }}
    />
  );
}
