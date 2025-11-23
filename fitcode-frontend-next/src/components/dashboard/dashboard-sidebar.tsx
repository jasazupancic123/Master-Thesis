import { theme } from '@/app/style';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import {
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
} from '@mui/icons-material';
import { alpha, Box, IconButton, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { DASHBOARD_SIDEBAR_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import ProfileCard from '@/ui/profile-card';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import DashboardSidebarMenuItems from './dashboard-sidebar-menu-items';
import { lib } from '@/lib';
import DashboardSidebarGroupMenu from './dashboard-sidebar-group-menu';

export default function DashboardSidebar() {
  const { role } = useAuthenticatedAuth();

  const { selectedInstitution, selectedGroup } = useDashboard();

  const [openGroupsMenu, setOpenGroupsMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openInstitutionsMenu, setOpenInstitutionsMenu] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );

  const anchorElGroupsRef = useRef<HTMLDivElement>(null);
  const anchorElInstitutionsRef = useRef<HTMLDivElement>(null);

  if (!selectedInstitution) return null;

  const shortGroupName = selectedGroup ? selectedGroup.name.slice(0, 3) : '';

  return (
    <>
      <Box
        width={DASHBOARD_SIDEBAR_WIDTH}
        height="100vh"
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
          maxWidth={DASHBOARD_SIDEBAR_WIDTH}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            px: 2,
            cursor: 'pointer',
          }}
        >
          <Typography
            width="100%"
            textAlign="start"
            fontSize={10}
            lineHeight={1}
            fontStyle="italic"
            sx={{
              color: alpha(theme.palette.text.primary, 0.6),
            }}
          >
            Selected group
          </Typography>
          <Box
            width={DASHBOARD_SIDEBAR_WIDTH}
            maxWidth={DASHBOARD_SIDEBAR_WIDTH}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            sx={{
              px: 2,
              position: 'relative',
            }}
            onClick={() => {
              setOpenGroupsMenu((prev) => !prev);
            }}
            gap={!selectedGroup ? 0.5 : 0}
          >
            <Typography
              width="100%"
              fontSize={40}
              fontWeight={800}
              lineHeight={1.2}
              textAlign="start"
              ref={anchorElGroupsRef}
              sx={{
                cursor: 'pointer',
                textTransform: 'uppercase',
                color: theme.palette.primary.main,
              }}
            >
              {shortGroupName}
            </Typography>

            <Typography
              width="100%"
              maxWidth={DASHBOARD_SIDEBAR_WIDTH}
              textAlign="start"
              fontSize={14}
              fontWeight={600}
              lineHeight={1}
              sx={{
                color: !selectedGroup
                  ? theme.palette.text.primary
                  : theme.palette.primary.main,
                textTransform: !selectedGroup ? undefined : 'uppercase',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedGroup ? selectedGroup.name : '-'}
            </Typography>

            <IconButton
              sx={{
                p: 0,
                m: 0,
                position: 'absolute',
                bottom: -6,
                right: 3,
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: theme.palette.background.default,
                borderRadius: '50%',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenGroupsMenu((prev) => !prev);
              }}
            >
              {openGroupsMenu ? (
                <KeyboardArrowUpOutlined sx={{ fontSize: 16 }} />
              ) : (
                <KeyboardArrowDownOutlined sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Box>

          <DashboardSidebarMenuItems />
        </Box>
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
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
        <DashboardSidebarGroupMenu
          achorElRef={anchorElGroupsRef}
          openGroupsMenu={openGroupsMenu}
          setOpenGroupsMenu={setOpenGroupsMenu}
        />
      </Box>
    </>
  );
}
