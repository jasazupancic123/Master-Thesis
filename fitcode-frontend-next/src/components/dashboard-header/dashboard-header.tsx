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
import { useState } from 'react';
import toast from 'react-hot-toast';

import DashboardMenuMobile from '../dashboard-menu-mobile/dashboard-menu-mobile';
import EditInstitutionModal from '../edit-institution-modal/edit-institution-modal';
import FilterButton from '../filter-button/filter-button';
import Logo from '../logo/logo';
import MyModal from '../modal/modal';
import ProfileHeaderMenu from '../profile-header-menu/profile-header-menu';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS } from '@/common/constant/navigation.constant';
import { isAdmin } from '@/common/firebase/firebase-auth.util';
import type { ILink } from '@/common/type/link.type';
import { handleApiRequest } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { GroupService } from '@/controller/group/group.service';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';

export default function DashboardHeader() {
  const {
    filter,
    setFilter,
    institutions,
    selectedInstitution,
    setSelectedInstitution,
    selectedGroup,
    setSelectedGroup,
    refetchMembers,
    updateUser,
  } = useDashboard();

  const { users } = useMain();
  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuthenticatedAuth();
  const { role } = auth;

  const controller = GroupController.getInstance();
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openInstitutionsMenu, setOpenInstitutionsMenu] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );
  const [anchorInstitutionsEl, setAnchorInstitutionsEl] =
    useState<HTMLElement | null>(null);
  const [modal, setModal] = useState({
    edit_institution: false,
    remove_group: false,
  });

  const handleRemoveSelectedGroup = () => {
    if (!selectedGroup) return;
    handleApiRequest(
      router,
      () => controller.delete(selectedGroup.id),
      () => {
        setSelectedGroup(null);
        setSelectedInstitution((prev) => {
          if (!prev) return null;
          const updatedGroups = prev.groups.filter(
            (g) => g.id !== selectedGroup.id
          );
          return { ...prev, groups: updatedGroups };
        });
        toast.success('Successfully deleted group');
      },
      undefined,
      'Failed to delete group'
    );
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      position="relative"
      sx={{
        mx: 'auto',
        backgroundColor: theme.palette.background.default,
      }}
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
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            px: 2,
          }}
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
                  src={auth.user?.photoURL || '/user_avatar.png'}
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

              {isAdmin(role!) ? (
                <Box
                  position="relative"
                  onClick={(event) => {
                    setAnchorInstitutionsEl(event.currentTarget);
                    setOpenInstitutionsMenu(!openInstitutionsMenu);
                  }}
                >
                  <Avatar
                    src={selectedInstitution?.imageUrl || ''}
                    sx={{
                      width: 34,
                      height: 34,
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
                    {!openInstitutionsMenu ? (
                      <KeyboardArrowDownTwoTone sx={{ fontSize: 15 }} />
                    ) : (
                      <KeyboardArrowUpTwoTone sx={{ fontSize: 15 }} />
                    )}
                  </IconButton>
                </Box>
              ) : (
                <Box
                  onClick={() =>
                    setModal((prev) => ({ ...prev, edit_institution: true }))
                  }
                >
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
                const mapped = GroupService.mapMembers(
                  institution.groups[0],
                  users
                );
                setSelectedGroup(mapped);
              } else setSelectedGroup(null);

              setOpenInstitutionsMenu(false);
              setAnchorInstitutionsEl(null);
              refetchMembers(
                `${BACKEND_API_BASE_URL}/institution/${institution.id}/find/all`
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

      <MyModal
        isOpen={modal.remove_group}
        setIsOpen={(open) =>
          setModal((prev) => ({ ...prev, remove_group: open }))
        }
        onCancel={() => setModal((prev) => ({ ...prev, remove_group: false }))}
        onConfirm={() => {
          handleRemoveSelectedGroup();
          setModal((prev) => ({ ...prev, remove_group: false }));
        }}
        cancelText="Close"
      >
        Remove group <strong>{selectedGroup?.name}</strong>?
      </MyModal>

      <EditInstitutionModal
        open={modal.edit_institution && !!selectedInstitution}
        institution={selectedInstitution!}
        onClose={() =>
          setModal((prev) => ({ ...prev, edit_institution: false }))
        }
      />
    </Box>
  );
}
