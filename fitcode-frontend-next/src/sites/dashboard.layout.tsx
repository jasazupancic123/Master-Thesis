'use client';

import { AppBar, Box, Container } from '@mui/material';
import { useTheme } from '@mui/material';

import DashboardHeader from '@/components/dashboard/dashboard-header';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { useScreenSize } from '@/store/screen-size.provider';
import DashboardMenuMobile from '@/components/dashboard/dashboard-menu-mobile';

export default function DashboardLayout({ children }: React.PropsWithChildren) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  return (
    <Box>
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          pb: 2,
          mx: 0,
          width: '100%',
        }}
      >
        <Box width="100%" display="flex" flexDirection="column">
          <DashboardHeader />

          <Box
            width="100%"
            display="flex"
            maxWidth={MAX_WIDTH}
            sx={{ mx: 'auto' }}
          >
            <Box sx={{ flex: 1, overflow: 'hidden' }}>{children}</Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
