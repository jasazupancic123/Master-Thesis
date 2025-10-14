'use client';

import { ArrowForward } from '@mui/icons-material';
import { Fab, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/material';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/common/constant/navigation.constant';
import { isTrainer } from '@/common/firebase/firebase-auth.util';
import DashboardGroups from '@/components/dashboard/components/dashboard-groups/dashboard-groups';
import RegisterUsersDashboard from '@/components/dashboard/components/dashboard-register-users-modal/dashboard-register-users-modal';
import { GroupService } from '@/controller/group/group.service';
import type { Institution } from '@/controller/institution/type/institution.type';
import { UserRole } from '@/controller/profile/enum/user-role.enum';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import MyModal from '@/util/modal/modal';

export default function DashboardPage() {
  const screenSize = useScreenSize();

  const { users, profile, groups: allGroups } = useMain();
  const { role } = useAuthenticatedAuth();

  const {
    institutions,
    selectedInstitution,
    setSelectedInstitution,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  const [openEditAthleteModal, setOpenEditAthleteModal] = useState(false);
  const [openAddTrainerModal, setOpenAddTrainerModal] = useState(false);

  useEffect(() => {
    // fetch groups when selected institution changes
    if (!selectedInstitution || selectedInstitution.groups) return;

    const fetchGroups = async () => {
      const groups = allGroups.filter(
        (g) => g.institutionId === selectedInstitution.id
      );

      for (const group of groups) GroupService.mapMembers(group, users);

      setSelectedInstitution((prev) => ({ ...prev, groups }) as Institution);
      if (groups.length) setSelectedGroup(groups[0]);
    };

    fetchGroups();
  }, [selectedInstitution]);

  if (!profile) return null;

  if (!institutions.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Typography variant="h6">No institutions available</Typography>
      </Box>
    );
  }

  if (!selectedInstitution) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Typography variant="h6">No institution selected</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          mb: 5,
        }}
      >
        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          width="100%"
          sx={{
            position: 'fixed',
            bottom: screenSize.isMobile ? 70 : 20,
            right: 20,
            zIndex: 100,
          }}
          gap={1}
        >
          {role && isTrainer(role) && (
            <Tooltip title="Go to group" placement="top">
              <Fab
                color="primary"
                aria-label="go"
                onClick={() => {
                  if (selectedGroup)
                    redirect(
                      LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(selectedGroup.id)
                        .home.href
                    );
                }}
              >
                <ArrowForward />
              </Fab>
            </Tooltip>
          )}
        </Box>

        <DashboardGroups />
      </Box>

      {/* Add Trainer Modal */}
      <MyModal
        isOpen={openAddTrainerModal}
        setIsOpen={(open) => setOpenAddTrainerModal(open)}
        onConfirm={undefined}
        onCancel={() => setOpenEditAthleteModal(false)}
        cancelText="Close"
      >
        <RegisterUsersDashboard registerRole={UserRole.TRAINER} />
      </MyModal>
    </>
  );
}
