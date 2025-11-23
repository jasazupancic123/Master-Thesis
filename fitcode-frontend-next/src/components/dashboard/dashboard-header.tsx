'use client';

import { Avatar, Box, Menu, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import Link from 'next/link';

import useDashboardHeaderUtils from './hooks/use-utils';
import EditInstitutionModal from './modals/edit-institution-modal';
import ProfileHeaderMenu from '@/components/profile-header-menu/profile-header-menu';
import {
  MAX_WIDTH,
  MAX_WIDTH_DASHBOARD,
} from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { LINK_DASHBOARD_SCHEDULE } from '@/lib/common/const/nav.const';
import { useDashboard } from '@/store/dashboard.provider';
import Logo from '@/ui/logo';

export default function DashboardHeader() {
  const theme = useTheme();

  const {
    setFilter,
    institutions,
    selectedInstitution,
    setSelectedInstitution,
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
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100%"
      maxWidth={MAX_WIDTH_DASHBOARD}
      position="relative"
      sx={{
        mx: 'auto',
        backgroundColor: theme.palette.background.default,
        pt: 2,
      }}
    >
      <Logo width={120} />

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
            setFilter(LINK_DASHBOARD_SCHEDULE);
            setOpenInstitutionsMenu(false);
            setAnchorInstitutionsEl(null);
          }}
        >
          <Link href={LINK_DASHBOARD_SCHEDULE.href} passHref>
            <Typography>Dashboard</Typography>
          </Link>
        </MenuItem>

        {institutions.map((institution) => (
          <MenuItem
            key={institution.id}
            onClick={() => {
              setSelectedInstitution(institution);

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
