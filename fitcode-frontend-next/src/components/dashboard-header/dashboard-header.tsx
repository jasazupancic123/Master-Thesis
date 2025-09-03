'use client';

import {
  Delete,
  KeyboardArrowDownTwoTone,
  KeyboardArrowUpTwoTone,
  Save,
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
import FilterButton from '../filter-button/filter-button';
import MyModal from '../modal/modal';
import ProfileHeaderMenu from '../profile-header-menu/profile-header-menu';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import {
  LINK_DASHBOARD,
  LINK_DASHBOARD_HOME,
  LINKS_DASHBOARD_SIDEBAR_MAIN_ITEMS,
} from '@/common/constant/navigation.constant';
import { isAdmin } from '@/common/firebase/firebase-auth.util';
import type { ILink } from '@/common/type/link.type';
import { handleApiRequest } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { useAuth } from '@/store/auth-provider';
import { useDashboard } from '@/store/dashboard-provider';
import { useScreenSize } from '@/store/screen-size-provider';

export default function DashboardHeader() {
  const {
    filter,
    setFilter,
    institutions,
    selectedInstitution,
    setSelectedInstitution,
    selectedGroup,
    setSelectedGroup,
    detectedChanges,
    setDetectedChanges,
  } = useDashboard();
  const { role, profile } = useAuth();
  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();

  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openInstitutionsMenu, setOpenInstitutionsMenu] = useState(false);
  const [anchorProfileEl, setAnchorProfileEl] = useState<HTMLElement | null>(
    null
  );
  const [anchorInstitutionsEl, setAnchorInstitutionsEl] =
    useState<HTMLElement | null>(null);
  const [modal, setModal] = useState({
    remove_group: false,
  });

  const handleSaveGroups = () => {
    if (!selectedInstitution) return;

    const inputs: { id: string; ownerId: string }[] = [];
    for (const group of selectedInstitution.groups) {
      inputs.push({ id: group.id, ownerId: group.ownerId });
    }

    handleApiRequest(
      router,
      () => GroupController.batchUpdate({ groups: inputs }),
      () => {
        setDetectedChanges(false);
        toast.success('Groups saved successfully');
      },
      undefined,
      'Failed to save groups'
    );
  };

  const handleRemoveSelectedGroup = () => {
    if (!selectedGroup) return;
    handleApiRequest(
      router,
      () => GroupController.delete(selectedGroup.id),
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
      width="100%"
      sx={{
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {screenSize.isMobile ? (
        <DashboardMenuMobile />
      ) : (
        <Box
          display="flex"
          justifyContent="flex-start"
          alignItems="center"
          sx={{
            position: 'absolute',
            left: screenSize.isDesktop ? 10 : 6,
            top: 10,
          }}
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
              src={profile?.profileImageUrl}
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
              {!openProfileMenu ? (
                <KeyboardArrowDownTwoTone
                  sx={{
                    fontSize: 15,
                  }}
                />
              ) : (
                <KeyboardArrowUpTwoTone
                  sx={{
                    fontSize: 15,
                  }}
                />
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
                  <KeyboardArrowDownTwoTone
                    sx={{
                      fontSize: 15,
                    }}
                  />
                ) : (
                  <KeyboardArrowUpTwoTone
                    sx={{
                      fontSize: 15,
                    }}
                  />
                )}
              </IconButton>
            </Box>
          ) : (
            <Link href={LINK_DASHBOARD.href} passHref>
              <Tooltip title="Dashboard">
                <Avatar
                  src={selectedInstitution?.imageUrl || ''}
                  sx={{
                    width: 34,
                    height: 34,
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            </Link>
          )}
          <Tooltip title="Settings">
            <Settings sx={{ fontSize: 20, cursor: 'pointer' }} />
          </Tooltip>
        </Box>
      )}
      <Box
        sx={{
          width: '100%',
          maxWidth: MAX_WIDTH,
          mx: 'auto',
        }}
      >
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val: ILink) => {
            if (detectedChanges) {
              toast.error('Unsaved changes will be lost', {
                icon: '⚠️',
                duration: 2000,
              });

              setDetectedChanges(false);
              return;
            }

            setFilter((prev) => (!val ? prev : val));
            router.push(val.href);
          }}
          sx={{
            display: 'flex',
            bgcolor: theme.palette.background.light,
            maxHeight: '38px',
            width: screenSize.isMobile
              ? '66% !important'
              : screenSize.isTablet
                ? '50% !important'
                : '33% !important',
            mx: 'auto',
            mt: '12px',
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
      <Box
        justifyContent="flex-end"
        alignItems="center"
        sx={{
          position: 'absolute',
          right: screenSize.isSmallerThanLaptop ? 2 : 10,
          top: 11,
          zIndex: 1300,
        }}
      >
        {filter === LINK_DASHBOARD_HOME && (
          <>
            <Tooltip title="Save groups" placement="bottom" sx={{ mx: 1 }}>
              <IconButton
                sx={{
                  p: 0,
                  m: 0,
                  mx: screenSize.isMobile ? 0.25 : 1,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  handleSaveGroups();
                }}
              >
                <Save fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete group" placement="bottom" sx={{ mx: 1 }}>
              <IconButton
                sx={{
                  p: 0,
                  m: 0,
                  mx: screenSize.isMobile ? 0.25 : 1,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setModal((prev) => ({
                    ...prev,
                    remove_group: true,
                  }));
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
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
              if (institution.groups && institution.groups.length)
                setSelectedGroup(institution.groups[0]);
              else setSelectedGroup(null);
              setOpenInstitutionsMenu(false);
              setAnchorInstitutionsEl(null);
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
                sx={{
                  width: 25,
                  height: 25,
                }}
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
    </Box>
  );
}
