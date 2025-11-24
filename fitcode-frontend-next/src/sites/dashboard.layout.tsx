'use client';

import { Box, Container } from '@mui/material';

import DashboardHeader from '@/components/dashboard/dashboard-header';
import DashboardSidebar from '@/components/dashboard-sidebar/dashboard-sidebar';
import DashboardSidebarMobile from '@/components/dashboard-sidebar/dashboard-sidebar-mobile';
import { DASHBOARD_SIDEBAR_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { useScreenSize } from '@/store/screen-size.provider';

export default function DashboardLayout({ children }: React.PropsWithChildren) {
  const screenSize = useScreenSize();
  const isSmall = screenSize.isMobile || screenSize.isTablet;

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          flexDirection: 'row',
          p: 0,
          m: 0,
          width: '100%',
        }}
      >
        {/* Desktop sidebar in the normal flow */}
        {!isSmall && (
          <Box
            component="aside"
            sx={{
              width: DASHBOARD_SIDEBAR_WIDTH,
              flexShrink: 0,
            }}
          >
            <DashboardSidebar />
          </Box>
        )}

        {/* Main content */}
        <Box
          component="section"
          sx={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            px: 1,
            overflowX: 'hidden',
          }}
        >
          {isSmall && <DashboardSidebarMobile />}
          <DashboardHeader />
          <Box sx={{ overflowX: 'hidden' }}>{children}</Box>
        </Box>
      </Container>
    </Box>
  );
}
