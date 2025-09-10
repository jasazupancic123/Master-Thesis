'use client';

import { ArrowForward } from '@mui/icons-material';
import { Fab, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/common/constant/navigation.constant';
import { isTrainer } from '@/common/firebase/firebase-auth.util';
import { handleApiRequest } from '@/common/type/state.type';
import AddGroupModal from '@/components/dashboard-add-group-modal/dashboard-add-group-modal';
import DashboardGroups from '@/components/dashboard-groups/dashboard-groups';
import RegisterUsersDashboard from '@/components/dashboard-register-users-modal/dashboard-register-users-modal';
import MyModal from '@/components/modal/modal';
import { GroupController } from '@/controller/group/group.controller';
import { GroupService } from '@/controller/group/group.service';
import type { Institution } from '@/controller/institution/type/institution.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import type { User } from '@/controller/user/type/user.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';

export default function DashboardPage() {
  const screenSize = useScreenSize();
  const router = useRouter();

  const { users, profile } = useMain();
  const { role, token } = useAuthenticatedAuth();
  const controller = GroupController.getInstance(token);

  const {
    institutions,
    selectedInstitution,
    setSelectedInstitution,
    detectedChanges,
    setDetectedChanges,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  const [modal, setModal] = useState({
    add_member: false,
    add_trainer: false,
    add_group: false,
    add_member_via_csv: false,
    edit_athlete: false,
  });
  const [groupName, setGroupName] = useState('');
  const [owner, setOwner] = useState<User | null>(null);

  useEffect(() => {
    // fetch groups when selected institution changes
    if (!selectedInstitution || selectedInstitution.groups) return;

    const fetchGroups = async () => {
      const groups = await controller.findAllByInstitution(
        selectedInstitution.id
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
                  if (selectedGroup) {
                    if (detectedChanges) {
                      toast.error('Unsaved changes will be lost', {
                        icon: '⚠️',
                        duration: 3000,
                      });
                      setDetectedChanges(false);
                    } else
                      redirect(
                        LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(selectedGroup.id)
                          .home.href
                      );
                  }
                }}
              >
                <ArrowForward />
              </Fab>
            </Tooltip>
          )}
        </Box>

        <DashboardGroups setModal={setModal} modal={modal} />

        {/* {screenSize.isSmallerThanLaptop ? (
          <Box
            display="flex"
            flexDirection="column"
            mt={2}
            width="100%"
            gap={1}
          >
            <Grid2
              container
              gap={2}
              wrap={screenSize.isTablet ? 'nowrap' : undefined}
            >
              <Grid2 size={screenSize.isMobile ? 12 : 6}>
                <ReportsContainer
                  index={0}
                  reportTypes={[
                    DashboardReportType.FLAGGED_ATHLETES,
                    DashboardReportType.ATTENDANCE,
                  ]}
                />
              </Grid2>
              <Grid2 size={screenSize.isMobile ? 12 : 6}>
                <ReportsContainer
                  index={1}
                  reportTypes={[
                    DashboardReportType.CYCLE_PROGRESS,
                    DashboardReportType.TODAYS_SESSIONS,
                  ]}
                />
              </Grid2>
            </Grid2>
            <Box
              width={screenSize.isSmallerThanLaptop ? '100%' : '50%'}
              margin="auto"
            >
              <DashboardChat />
            </Box>
          </Box>
        ) : (
          <Grid2 container gap={2} wrap="nowrap" mt={2}>
            <Grid2 size={3}>
              <ReportsContainer
                index={0}
                reportTypes={[
                  DashboardReportType.FLAGGED_ATHLETES,
                  DashboardReportType.ATTENDANCE,
                ]}
              />
            </Grid2>
            <Grid2 size={3}>
              <ReportsContainer
                index={1}
                reportTypes={[DashboardReportType.CYCLE_PROGRESS]}
              />
            </Grid2>
            <Grid2 size={3}>
              <ReportsContainer
                index={2}
                reportTypes={[DashboardReportType.TODAYS_SESSIONS]}
              />
            </Grid2>
            <Grid2 size={3}>
              <DashboardChat />
            </Grid2>
          </Grid2>
        )} */}
      </Box>

      {/* Add Trainer Modal */}
      <MyModal
        isOpen={modal.add_trainer}
        setIsOpen={(open) =>
          setModal({
            add_trainer: open,
            add_member: false,
            add_group: false,
            add_member_via_csv: false,
            edit_athlete: false,
          })
        }
        onConfirm={undefined}
        onCancel={() =>
          setModal({
            add_member: false,
            add_trainer: false,
            add_group: false,
            add_member_via_csv: false,
            edit_athlete: false,
          })
        }
        cancelText="Close"
      >
        <RegisterUsersDashboard registerRole={UserRole.TRAINER} />
      </MyModal>

      {/* Add Group Modal */}
      <MyModal
        isOpen={modal.add_group}
        setIsOpen={(open) =>
          setModal({
            add_member: false,
            add_trainer: false,
            add_group: open,
            add_member_via_csv: false,
            edit_athlete: false,
          })
        }
        onCancel={() => {
          setModal({
            add_member: false,
            add_trainer: false,
            add_group: false,
            add_member_via_csv: false,
            edit_athlete: false,
          });
          setGroupName('');
        }}
        cancelText="Close"
        onConfirm={async () => {
          if (!owner) {
            toast.error('Please select an owner for the group.');
            return;
          }

          const input = {
            name: groupName,
            membersIds: [],
            ownerId: owner.uid,
            institutionId: selectedInstitution.id,
          };

          handleApiRequest(
            router,
            () => controller.create(input),
            (group) => {
              setSelectedInstitution({
                ...selectedInstitution,
                groups: [...selectedInstitution.groups, group],
              });
              setSelectedGroup(group);
              setModal({
                add_member: false,
                add_trainer: false,
                add_group: false,
                add_member_via_csv: false,
                edit_athlete: false,
              });
              setGroupName('');
              setDetectedChanges(false);
              toast.success('Group created successfully.');
            },
            undefined,
            'Failed to create group.'
          );
        }}
      >
        <AddGroupModal
          groupName={groupName}
          setGroupName={setGroupName}
          owner={owner}
          setOwner={setOwner}
        />
      </MyModal>
    </>
  );
}
