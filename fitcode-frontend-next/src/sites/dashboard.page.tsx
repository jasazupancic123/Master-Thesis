'use client';

import { ArrowForward } from '@mui/icons-material';
import { Fab, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/material';
import { redirect } from 'next/navigation';
import { useState } from 'react';

import DashboardGroups from '@/components/dashboard/dashboard-groups';
import RegisterUsersDashboard from '@/components/dashboard/dashboard-register-users-modal';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { lib } from '@/lib';
import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/lib/common/const/nav.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import MyModal from '@/ui/modal';

export default function DashboardPage() {
  const screenSize = useScreenSize();

  const { profile } = useMain();
  const { role } = useAuthenticatedAuth();

  const { institutions, selectedInstitution, selectedGroup } = useDashboard();

  const [openAddTrainerModal, setOpenAddTrainerModal] = useState(false);

  if (!profile) return null;

  if (!institutions.length)
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

  if (!selectedInstitution)
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
          {role &&
            (lib.firebase.auth.isTrainer(role) ||
              lib.firebase.auth.isManager(role)) && (
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
        onCancel={() => setOpenAddTrainerModal(false)}
        cancelText="Close"
      >
        <RegisterUsersDashboard registerRole={UserRole.TRAINER} />
      </MyModal>
    </>
  );
}
