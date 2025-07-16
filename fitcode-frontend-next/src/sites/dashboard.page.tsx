'use client';

import { DashboardReportType } from '@/common/enum/dashboard-report-type.enum';
import AddGroupModal from '@/components/dashboard-add-group-modal/dashboard-add-group-modal';
import ReportsContainer from '@/components/dashboard-reports-container/dashboard-reports-container';
import MyModal from '@/components/modal/modal';
import { useScreenSize } from '@/store/screen-size-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { User } from '@/controller/user/type/user.type';
import { ArrowForward, Save } from '@mui/icons-material';
import { Fab, Grid2, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardChat from '@/components/dashboard-chat/dashboard-chat';
import AthletesView from '../components/dashboard-athletes-view/dashboard-athletes-view';
import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/common/constant/navigation.constant';
import { redirect } from 'next/navigation';
import { useDashboard } from '@/store/dashboard-provider';
import { handleApiRequest } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import {
  DASHBOARD_GROUPS,
  DASHBOARD_MAIN,
} from '@/common/constant/dashboard-views-constant';
import { Institution } from '@/controller/institution/type/institution.type';
import DashboardStaffGroupsCycles from '@/components/dashboard-staff-groups-cycles/dashboard-staff-groups-cycles';
import { isManager, isTrainer } from '@/common/service/util/firebase-auth.util';
import RegisterUsersDashboard from '@/components/dashboard-register-users-modal/dashboard-register-users-modal';
import { useMain } from '@/store/main-provider';

interface DashboardPageProps {
  view: string;
}

export default function DashboardPage(props: DashboardPageProps) {
  const screenSize = useScreenSize();
  const router = useRouter();

  const { profile } = useMain();

  const {
    institutions,
    selectedInstitution,
    setSelectedInstitution,
    detectedChanges,
    setDetectedChanges,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  if (!profile) return null;

  const { view } = props;

  const [modal, setModal] = useState({ add_trainer: false, add_group: false });
  const [groupName, setGroupName] = useState('');
  const [owner, setOwner] = useState<User | null>(null);

  const role = profile.customClaims.role || [];

  useEffect(() => {
    // fetch groups when selected institution changes
    if (!selectedInstitution || selectedInstitution.groups) return;
    const fetchGroups = async () => {
      const groups = await GroupController.findAllByInstitution(
        selectedInstitution.id
      );

      setSelectedInstitution((prev) => ({ ...prev, groups }) as Institution);
      if (groups.length) setSelectedGroup(groups[0]);
    };
    fetchGroups();
  }, [selectedInstitution]);

  const handleSaveGroups = () => {
    if (!selectedInstitution) return;

    const inputs: { id: string; membersIds: string[]; ownerId: string }[] = [];
    for (const group of selectedInstitution.groups) {
      const membersIds = group.members
        ? new Set([...group.membersIds, ...group.members.map((m) => m.uid)])
        : group.membersIds;

      inputs.push({
        id: group.id,
        ownerId: group.ownerId,
        membersIds: Array.from(membersIds),
      });
    }

    handleApiRequest(
      router,
      () => GroupController.batchUpdate({ groups: inputs }),
      () => {
        /* const newGroup = groups.find((g) => g.id === selectedGroup?.id);
        if (newGroup) {
          setSelectedGroup(newGroup);
        } */
        /* setSelectedInstitution({
          ...selectedInstitution!,
          groups: groups,
        }); */
        setDetectedChanges(false);
        toast.success('Groups saved successfully');
      },
      undefined,
      'Failed to save groups'
    );
  };

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
          {detectedChanges && (isManager(role) || isTrainer(role)) && (
            <Tooltip title="Save changes" placement="top">
              <Fab color="primary" aria-label="save" onClick={handleSaveGroups}>
                <Save />
              </Fab>
            </Tooltip>
          )}

          {isTrainer(role) && (
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

        <DashboardStaffGroupsCycles setModal={setModal} />

        {view === DASHBOARD_MAIN ? (
          screenSize.isSmallerThanLaptop ? (
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
          )
        ) : (
          view === DASHBOARD_GROUPS && <AthletesView />
        )}
      </Box>

      {/* Add Trainer Modal */}
      <MyModal
        isOpen={modal.add_trainer}
        setIsOpen={(open) => setModal({ add_trainer: open, add_group: false })}
        onConfirm={undefined}
        onCancel={() => setModal({ add_trainer: false, add_group: false })}
        cancelText="Close"
      >
        <RegisterUsersDashboard registerRole={UserRole.TRAINER} />
      </MyModal>

      {/* Add Group Modal */}
      <MyModal
        isOpen={modal.add_group}
        setIsOpen={(open) => setModal({ add_trainer: false, add_group: open })}
        onCancel={() => {
          setModal({ add_trainer: false, add_group: false });
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
            () => GroupController.create(input),
            (group) => {
              setSelectedInstitution({
                ...selectedInstitution,
                groups: [...selectedInstitution.groups, group],
              });
              setModal({ add_trainer: false, add_group: false });
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
