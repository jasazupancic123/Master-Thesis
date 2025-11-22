import { theme } from '@/app/style';
import { Group } from '@/core/group/type/group.type';
import { DASHBOARD_VIEWS } from '@/lib/common/const/nav.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import {
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
} from '@mui/icons-material';
import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  DASHBOARD_SIDEBAR_WIDTH,
  DASHBOARD_SIDEBAR_WIDTH_NUMERIC,
} from '../trainer-group-day-view/constant/dimensions.constant';
import ProfileCard from '@/ui/profile-card';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import DashboardSidebarMenuItems from './dashboard-sidebar-menu-items';
import Image from 'next/image';
import { lib } from '@/lib';

export default function DashboardSidebar() {
  const router = useRouter();
  const { role } = useAuthenticatedAuth();

  const {
    filter,
    setFilter,
    selectedInstitution,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  const anchorElRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );

  if (!selectedInstitution) return null;

  const shortGroupName = selectedGroup ? selectedGroup.name.slice(0, 3) : '';

  return (
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
        <Typography width="100%" textAlign="start" fontSize={12} lineHeight={1}>
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
          }}
          onClick={() => setOpenMenu((prev) => !prev)}
        >
          <Typography
            width="100%"
            fontSize={40}
            fontWeight={800}
            lineHeight={1.2}
            textAlign="start"
            ref={anchorElRef}
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
            maxWidth={DASHBOARD_SIDEBAR_WIDTH}
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
            }}
          >
            {selectedGroup?.name}
          </Typography>
        </Box>

        <DashboardSidebarMenuItems />

        <Menu
          anchorEl={anchorElRef.current}
          open={openMenu}
          onClose={() => {
            setOpenMenu(false);
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          sx={{ top: 48 }}
        >
          {!selectedInstitution.groups.length ? (
            <Typography sx={{ px: 1 }}>No groups</Typography>
          ) : (
            selectedInstitution.groups
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((group: Group) => {
                return (
                  <MenuItem
                    key={group.id}
                    value={group.id}
                    onClick={() => {
                      setSelectedGroup(group);
                      setOpenMenu(false);
                    }}
                  >
                    <Typography>{group.name}</Typography>
                  </MenuItem>
                );
              })
          )}
        </Menu>
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
            width={DASHBOARD_SIDEBAR_WIDTH_NUMERIC * 0.3}
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
    </Box>
  );
}
