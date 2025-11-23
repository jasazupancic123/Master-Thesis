'use client';

import { theme } from '@/app/style';
import { Group } from '@/core/group/type/group.type';
import { useDashboard } from '@/store/dashboard.provider';
import {
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
  Menu as MenuIcon,
} from '@mui/icons-material';
import {
  Box,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import ProfileCard from '@/ui/profile-card';
import DashboardSidebarMenuItems from './dashboard-sidebar-menu-items';
import DashboardSidebarGroupMenu from './dashboard-sidebar-group-menu';

export default function DashboardSidebarMobile() {
  const { selectedInstitution, selectedGroup, setSelectedGroup } =
    useDashboard();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );
  const [openGroupsMenu, setOpenGroupsMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);

  const anchorElGroupsRef = useRef<HTMLDivElement>(null);

  if (!selectedInstitution) return null;

  const shortGroupName = selectedGroup ? selectedGroup.name.slice(0, 3) : '';

  const handleChangeGroup = (group: Group) => {
    setSelectedGroup(group);
    setOpenGroupsMenu(false);
  };

  const DRAWER_WIDTH = 170;

  return (
    <>
      {/* Floating button to open drawer */}
      <IconButton
        aria-label="Open dashboard menu"
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: theme.palette.background.default,
          boxShadow: 1,
          zIndex: 10,
        }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }} // better perf on mobile
        sx={{ zIndex: 90 }}
      >
        <Box
          role="presentation"
          height="100%"
          sx={{
            width: DRAWER_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'space-between',
          }}
        >
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            sx={{
              p: 2,
            }}
          >
            <Typography
              width="100%"
              textAlign="start"
              fontSize={12}
              lineHeight={1}
            >
              Selected group
            </Typography>

            <Box width="100%">
              <Typography
                width="100%"
                fontSize={40}
                fontWeight={800}
                lineHeight={1.2}
                textAlign="start"
                ref={anchorElGroupsRef}
                onClick={() => setOpenGroupsMenu((prev) => !prev)}
                sx={{
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  color: theme.palette.primary.main,
                  position: 'relative',
                }}
              >
                {shortGroupName}
                <IconButton
                  sx={{
                    p: 0,
                    m: 0,
                    position: 'absolute',
                    bottom: -5,
                    right: -2,
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
              </Typography>

              <Typography
                width="100%"
                textAlign="start"
                fontSize={16}
                fontWeight={600}
                lineHeight={1}
                sx={{
                  color: theme.palette.primary.main,
                  textTransform: 'uppercase',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mt: 0.5,
                }}
              >
                {selectedGroup?.name}
              </Typography>
            </Box>

            <DashboardSidebarMenuItems />

            {/* Group menu (same as sidebar) */}
            <Menu
              anchorEl={anchorElGroupsRef.current}
              open={openGroupsMenu}
              onClose={() => setOpenGroupsMenu(false)}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              sx={{ mt: 2, top: 30 }}
            >
              {!(selectedInstitution.groups || []).length ? (
                <Typography sx={{ px: 1 }}>No groups</Typography>
              ) : (
                selectedInstitution.groups
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((group: Group) => (
                    <MenuItem
                      key={group.id}
                      value={group.id}
                      onClick={() => handleChangeGroup(group)}
                    >
                      <Typography>{group.name}</Typography>
                    </MenuItem>
                  ))
              )}
            </Menu>
          </Box>
        </Box>

        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          <ProfileCard
            anchorEl={anchorProfileEl}
            open={openProfileMenu}
            setOpen={setOpenProfileMenu}
            setAnchorEl={setAnchorProfileEl}
          />
        </Box>
      </Drawer>
      <DashboardSidebarGroupMenu
        achorElRef={anchorElGroupsRef}
        openGroupsMenu={openGroupsMenu}
        setOpenGroupsMenu={setOpenGroupsMenu}
      />
    </>
  );
}
