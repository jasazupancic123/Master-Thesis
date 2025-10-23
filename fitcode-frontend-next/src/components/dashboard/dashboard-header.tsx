'use client';

import {
  KeyboardArrowDownTwoTone,
  KeyboardArrowUpTwoTone,
  Settings,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import DashboardMenuMobile from './dashboard-menu-mobile';
import EditInstitutionModal from './edit-institution-modal';
import useDashboardHeaderUtils from './hooks/use-utils';
import ProfileHeaderMenu from '@/components/profile-header-menu/profile-header-menu';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { core } from '@/core/core.service';
import { BACKEND_API_BASE_URL } from '@/core/const/api.const';
import { lib } from '@/lib';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS } from '@/lib/common/const/nav.const';
import type { ILink } from '@/lib/common/type/link.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FilterButton from '@/ui/filter-button';
import Logo from '@/ui/logo';

export default function DashboardHeader() {
  const { user, role } = useAuthenticatedAuth();
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();

  const { users } = useMain();
  const {
    filter,
    setFilter,
    institutions,
    selectedInstitution,
    setSelectedInstitution,
    setSelectedGroup,
    refetchMembers,
  } = useDashboard();

  const {
    openProfileMenu,
    setOpenProfileMenu,
    openInstitutionsMenu,
    setOpenInstitutionsMenu,
    anchorProfileEl,
    setAnchorProfileEl,
    anchorInstitutionsEl,
    setAnchorInstitutionsEl,
    openEditInstitutionModal,
    setOpenEditInstitutionModal,
  } = useDashboardHeaderUtils();

  return (
    <Box
      display="flex"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      position="relative"
      sx={{ mx: 'auto', backgroundColor: theme.palette.background.default }}
    >
      {screenSize.isMobile ? (
        <DashboardMenuMobile />
      ) : (
        <Box
          width="100%"
          height="50px"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ position: 'absolute', right: 0, top: 0, px: 2 }}
          gap={3}
        >
          <Logo width={101.25} />

          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            gap={4}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
              gap={1}
            >
              <Box
                position="relative"
                onClick={(event) => {
                  setAnchorProfileEl(event.currentTarget);
                  setOpenProfileMenu(!openProfileMenu);
                }}
              >
                <Avatar
                  src={user?.photoURL || USER_AVATAR_IMG_URL}
                  sx={{
                    width: 30,
                    height: 30,
                    cursor: 'pointer',
                  }}
                />

                <IconButton
                  sx={{
                    p: 0,
                    m: 0,
                    position: 'absolute',
                    bottom: -2,
                    right: 0,
                    backgroundColor: theme.palette.background.dark,
                    borderRadius: '50%',
                  }}
                >
                  {!openProfileMenu ? (
                    <KeyboardArrowDownTwoTone sx={{ fontSize: 15 }} />
                  ) : (
                    <KeyboardArrowUpTwoTone sx={{ fontSize: 15 }} />
                  )}
                </IconButton>
              </Box>

              {lib.firebase.auth.isAdmin(role!) ? (
                <Box
                  position="relative"
                  onClick={(event) => {
                    setAnchorInstitutionsEl(event.currentTarget);
                    setOpenInstitutionsMenu(!openInstitutionsMenu);
                  }}
                >
                  <Avatar
                    src={selectedInstitution?.imageUrl || ''}
                    sx={{ width: 34, height: 34, cursor: 'pointer' }}
                  />
                  <IconButton
                    sx={{
                      p: 0,
                      m: 0,
                      position: 'absolute',
                      bottom: -2,
                      right: 0,
                      backgroundColor: theme.palette.background.dark,
                      borderRadius: '50%',
                    }}
                  >
                    {!openInstitutionsMenu ? (
                      <KeyboardArrowDownTwoTone sx={{ fontSize: 15 }} />
                    ) : (
                      <KeyboardArrowUpTwoTone sx={{ fontSize: 15 }} />
                    )}
                  </IconButton>
                </Box>
              ) : (
                <Box onClick={() => setOpenEditInstitutionModal(true)}>
                  <Tooltip title="Dashboard">
                    <Avatar
                      src={selectedInstitution?.imageUrl || ''}
                      sx={{ width: 34, height: 34, cursor: 'pointer' }}
                    />
                  </Tooltip>
                </Box>
              )}

              <Tooltip title="Settings">
                <Settings sx={{ fontSize: 20, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ width: '100%', mx: 'auto' }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val: ILink) => {
            setFilter((prev) => (!val ? prev : val));
            router.push(val.href);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: '50px',
            justifyContent: 'center',
            gap: 4,
            width:
              screenSize.isMobile || screenSize.isTablet
                ? '50% !important'
                : '33% !important',
            mx: 'auto',
          }}
        >
          {Object.values(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role!)).map(
            (val) => {
              if (!val) return null;
              return (
                <FilterButton
                  key={val.label}
                  value={val}
                  dashboardView
                  numValues={
                    Object.values(
                      LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role!)
                    ).filter((item) => item !== undefined).length
                  }
                />
              );
            }
          )}
        </ToggleButtonGroup>
      </Box>

      <ProfileHeaderMenu
        anchorEl={anchorProfileEl}
        open={openProfileMenu}
        setOpen={setOpenProfileMenu}
        setAnchorEl={setAnchorProfileEl}
      />

      <Menu
        anchorEl={anchorInstitutionsEl}
        open={openInstitutionsMenu}
        onClose={() => {
          setOpenInstitutionsMenu(false);
          setAnchorInstitutionsEl(null);
        }}
      >
        <MenuItem
          onClick={() => {
            setFilter(LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role!).home);
            setOpenInstitutionsMenu(false);
            setAnchorInstitutionsEl(null);
          }}
        >
          <Link
            href={LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS(role!).home.href}
            passHref
          >
            <Typography>Dashboard</Typography>
          </Link>
        </MenuItem>

        {institutions.map((institution) => (
          <MenuItem
            key={institution.id}
            onClick={() => {
              setSelectedInstitution(institution);
              if (institution.groups && institution.groups.length) {
                const mapped = core.group.mapMembers(
                  institution.groups[0],
                  users
                );

                setSelectedGroup(mapped);
              } else setSelectedGroup(null);

              setOpenInstitutionsMenu(false);
              setAnchorInstitutionsEl(null);
              refetchMembers(
                `${BACKEND_API_BASE_URL}/institution/${institution.id}/members`
              );
            }}
          >
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
              gap={1}
            >
              <Avatar
                src={institution.imageUrl || ''}
                sx={{ width: 25, height: 25 }}
              />
              <Typography>{institution.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      <EditInstitutionModal
        open={openEditInstitutionModal && !!selectedInstitution}
        institution={selectedInstitution!}
        onClose={() => setOpenEditInstitutionModal(false)}
      />
    </Box>
  );
}
