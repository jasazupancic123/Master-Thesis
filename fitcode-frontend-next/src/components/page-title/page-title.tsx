import { Box, Typography } from '@mui/material';

import { theme } from '@/app/style';
import { useScreenSize } from '@/store/screen-size-provider';

export default function PageTitle({ title }: { title: string }) {
  const screenSize = useScreenSize();
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      px={screenSize.isMobile ? 5 : 3}
      pt={1}
      minWidth={
        screenSize.isMobile
          ? undefined
          : screenSize.isSmallerThanLaptop
            ? '400px'
            : '600px'
      }
      width={screenSize.isMobile ? '90%' : undefined}
      sx={{
        backgroundColor: theme.palette.background.default,
        borderRadius: screenSize.isMobile ? '0 0 40px 40px' : '0 0 40px 40px',
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        textAlign={screenSize.isSmallerThanLaptop ? 'center' : undefined}
      >
        {title}
      </Typography>
    </Box>
  );
}
