'use client';

import { theme } from '@/app/style';
import { Group } from '@/core/group/type/group.type';
import { DASHBOARD_VIEWS } from '@/lib/common/const/nav.const';
import { ILink } from '@/lib/common/type/link.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import {
  KeyboardArrowDownOutlined,
  KeyboardArrowDownTwoTone,
  KeyboardArrowUpOutlined,
  KeyboardArrowUpTwoTone,
  Menu as MenuIcon,
  MoreVert,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import ProfileHeaderMenu from '../profile-header-menu/profile-header-menu';
import ProfileCard from '@/ui/profile-card';
import DashboardSidebarMenuItems from './dashboard-sidebar-menu-items';
import Image from 'next/image';
import { lib } from '@/lib';

export default function DashboardMobileDrawer() {
  const router = useRouter();
  const { user, role } = useAuthenticatedAuth();

  const {
    filter,
    setFilter,
    selectedInstitution,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const anchorElRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState(false);

  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );

  if (!selectedInstitution) return null;

  const shortGroupName = selectedGroup ? selectedGroup.name.slice(0, 3) : '';

  const handleChangeView = (val: ILink) => {
    setFilter(val);
    router.push(val.href);
    setDrawerOpen(false);
  };

  const handleChangeGroup = (group: Group) => {
    setSelectedGroup(group);
    setOpenMenu(false);
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
          zIndex: 99,
        }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }} // better perf on mobile
        sx={{ zIndex: 100 }}
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
                ref={anchorElRef}
                onClick={() => setOpenMenu((prev) => !prev)}
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
                    setOpenMenu((prev) => !prev);
                  }}
                >
                  {openMenu ? (
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
              anchorEl={anchorElRef.current}
              open={openMenu}
              onClose={() => setOpenMenu(false)}
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
              {!selectedInstitution.groups.length ? (
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
          {selectedInstitution.imageUrl && (
            <Image
              src={selectedInstitution.imageUrl}
              alt="Institution"
              unoptimized={lib.common.env.unoptimizeImages()}
              width={DRAWER_WIDTH * 0.3}
              height={0}
              layout="intrinsic"
              style={{ objectFit: 'cover' }}
            />
          )}

          <ProfileCard
            anchorEl={anchorProfileEl}
            open={openProfileMenu}
            setOpen={setOpenProfileMenu}
            setAnchorEl={setAnchorProfileEl}
          />
        </Box>
      </Drawer>
    </>
  );
}
