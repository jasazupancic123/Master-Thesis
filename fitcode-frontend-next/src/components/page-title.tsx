import { theme } from '@/app/style';
import { useScreenSize } from '@/context/screen-size-provider';
import { Box, Typography } from '@mui/material';

export default function PageTitle({ title }: { title: string }) {
  const screenSize = useScreenSize();
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      px={3}
      pt={1}
      minWidth={screenSize.isMobile ? undefined : '600px'}
      width={screenSize.isMobile ? '90%' : undefined}
      sx={{
        backgroundColor: theme.palette.background.default,
        borderRadius: '0 0 40px 40px',
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
