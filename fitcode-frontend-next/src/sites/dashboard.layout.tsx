'use client';

import { Box, Container } from '@mui/material';

import DashboardHeader from '@/components/dashboard/dashboard-header';
import {
  DASHBOARD_SIDEBAR_WIDTH,
  MAX_WIDTH_DASHBOARD,
} from '@/components/trainer-group-day-view/constant/dimensions.constant';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { useScreenSize } from '@/store/screen-size.provider';
import DashboardSidebarMobile from '@/components/dashboard/dashboard-sidebar-mobile';

export default function DashboardLayout({ children }: React.PropsWithChildren) {
  const screenSize = useScreenSize();

  const isSmall = screenSize.isMobile || screenSize.isTablet;

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
        <Box width="100%" display="flex">
          {!isSmall && <DashboardSidebar />}
          <Box
            minWidth={`${isSmall ? 0 : DASHBOARD_SIDEBAR_WIDTH} !important`}
          />

          <Box
            width={'100%'}
            maxWidth={MAX_WIDTH_DASHBOARD}
            display="flex"
            flexDirection="column"
            sx={{ position: 'relative', mx: 'auto', px: 1 }}
          >
            {isSmall && <DashboardSidebarMobile />}
            <DashboardHeader />
            <Box sx={{ overflow: 'hidden' }}>{children}</Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
