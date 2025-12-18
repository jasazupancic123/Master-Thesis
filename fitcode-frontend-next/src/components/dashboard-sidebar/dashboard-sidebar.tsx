import { Box } from '@mui/material';
import { useState } from 'react';

import { DASHBOARD_SIDEBAR_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import DashboardSidebarMenuItems from './dashboard-sidebar-menu-items';
import { theme } from '@/app/style';
import { lib } from '@/lib';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import Logo from '@/ui/logo';
import ProfileCard from '@/ui/profile-card';

interface Props {
  setDrawerOpen?: SetState<boolean>;
}

export default function DashboardSidebar(props: Props) {
  const { role } = useAuthenticatedAuth();

  const { setDrawerOpen } = props;

  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );

  return (
    <>
      <Box
        width={DASHBOARD_SIDEBAR_WIDTH}
        height="100dvh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        pt={2}
        sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          backgroundColor: theme.palette.background.light,
          zIndex: 1000,
          overflowY: 'auto',
          overflowX: 'hidden',
          ...styledScrollbarSx(theme),
        }}
      >
        <Box
          width={DASHBOARD_SIDEBAR_WIDTH}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="flex-start"
          gap={4}
        >
          <Logo width={160} />
          <Box
            width={DASHBOARD_SIDEBAR_WIDTH}
            maxWidth={DASHBOARD_SIDEBAR_WIDTH}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            sx={{
              px: 2,
            }}
          >
            <DashboardSidebarMenuItems setDrawerOpen={setDrawerOpen} />
          </Box>
        </Box>
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{
            cursor: lib.firebase.auth.isAdmin(role) ? 'pointer' : undefined,
          }}
        >
          <ProfileCard
            anchorEl={anchorProfileEl}
            open={openProfileMenu}
            setOpen={setOpenProfileMenu}
            setAnchorEl={setAnchorProfileEl}
          />
        </Box>
      </Box>
    </>
  );
}
