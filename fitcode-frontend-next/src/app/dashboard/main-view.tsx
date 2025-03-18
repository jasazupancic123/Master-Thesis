'use client';

import { DashboardReportType } from '@/common/enum/dashboard-report-type.enum';
import { AddMembersModal } from '@/components/add-members-modal';
import AddGroupModal from '@/components/dashboard/add-group-modal';
import ReportsContainer from '@/components/dashboard/reports-container';
import MyModal from '@/components/modal';
import { useScreenSize } from '@/context/screen-size-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { User } from '@/controller/user/type/user.type';
import { ArrowForward, Groups, PersonAddAlt } from '@mui/icons-material';
import {
  Avatar,
  Fab,
  Grid2,
  IconButton,
  ToggleButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Box } from '@mui/material';
import { useState } from 'react';
import { handleCreateGroupWithReturn } from '../groups/[group_id]/add-group/state';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardChat from '@/components/dashboard/dashboard-chat';
import { Group } from '@/controller/group/type/group.type';
import { Organization } from '@/controller/organization/type/organization.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import AthletesView from './athletes-view';
import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/common/constant/navigation.constant';
import { redirect } from 'next/navigation';

const AVATAR_SIZE = 45;

interface MainDashboardViewProps {
  organization: Organization;
  users: User[];
  token: string;
  profile: User;
  view: 'mainView' | 'athletes';
}

export default function MainDashboardView(props: MainDashboardViewProps) {
  const { organization, users, token, profile, view } = props;

  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(organization);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(
    organization.groups[0] || null
  );
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(
    selectedGroup?.cycles[0] || null
  );
  const [modal, setModal] = useState({ add_trainer: false, add_group: false });
  const [groupName, setGroupName] = useState('');
  const [selectedView, setSelectedView] = useState({
    main: true,
    athletes: false,
  });

  const setTrainers = (trainers: User[]) => {
    setSelectedOrganization({
      ...selectedOrganization!,
      trainers,
    });
  };

  const redirectToGroupId = () => {
    if (!selectedGroup) return;
    redirect(LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(selectedGroup.id).home.href);
  };

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
        <Tooltip title="Go to group" placement="top">
          <Fab
            color="primary"
            aria-label="go"
            onClick={redirectToGroupId}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
            }}
          >
            <ArrowForward />
          </Fab>
        </Tooltip>
        <Grid2
          container
          size={12}
          gap={2}
          wrap="nowrap"
          direction={screenSize.isMobile ? 'column' : 'row'}
        >
          <Grid2
            size={screenSize.isMobile ? 12 : 6}
            sx={{ position: 'relative' }}
          >
            {/* {profile.customClaims.role.includes(UserRole.MANAGER) ||
              (profile.customClaims.role.includes(UserRole.ADMIN) && ( */}
            <Tooltip title="Add trainer" placement="top">
              <IconButton
                onClick={() =>
                  setModal({ add_trainer: true, add_group: false })
                }
                sx={{
                  m: 0,
                  p: 0,
                  position: 'absolute',
                  top: 10,
                  right: 20,
                }}
              >
                <PersonAddAlt />
              </IconButton>
            </Tooltip>
            {/* ))} */}
            <Grid2
              container
              size={12}
              direction="column"
              sx={{
                border: `2px solid ${theme.palette.primary.main}`,
                borderRadius: '10px',
                pb: 4,
              }}
            >
              <Grid2
                size={2}
                width="100%"
                display="flex"
                justifyContent="center"
              >
                <ToggleButton
                  value={'STAFF'}
                  disableRipple
                  disabled
                  sx={{
                    width: '33%',
                    px: 5,
                    py: 0.5,
                    color: '#fff',
                    backgroundColor: theme.palette.primary.main,
                    borderBottomLeftRadius: '80px',
                    borderBottomRightRadius: '80px',
                    border: 'none',
                    '&:disabled': {
                      color: '#fff',
                    },
                    textTransform: 'none',
                  }}
                >
                  STAFF
                </ToggleButton>
              </Grid2>
              <Grid2 size={10} width="100%">
                <Grid2 container size={12}>
                  <Grid2 size={4}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap={1}
                    >
                      <Typography variant="body1">MANAGER</Typography>
                      <Tooltip
                        title={selectedOrganization?.manager.displayName || ''}
                        placement="top"
                      >
                        <Avatar
                          className="avatar-border"
                          src={'/user_avatar.png'}
                          sx={{
                            width: screenSize.isMobile ? 70 : 90,
                            height: screenSize.isMobile ? 70 : 90,
                          }}
                        />
                      </Tooltip>
                    </Box>
                  </Grid2>
                  <Grid2
                    size={8}
                    display="flex"
                    flexWrap="wrap"
                    columnGap={4}
                    rowGap={0}
                    maxHeight={150}
                    overflow="auto"
                  >
                    {selectedOrganization &&
                      selectedOrganization.trainers.map((trainer) => (
                        <Box
                          key={trainer.uid}
                          display="flex"
                          flexDirection="column"
                          justifyContent="flex-start"
                          gap={1}
                          py={2}
                        >
                          <Tooltip title={trainer.displayName} placement="top">
                            <Avatar
                              className="avatar-border"
                              src="/user_avatar.png"
                              sx={{
                                width: 42,
                                height: 42,
                              }}
                            />
                          </Tooltip>
                        </Box>
                      ))}
                  </Grid2>
                </Grid2>
              </Grid2>
            </Grid2>
          </Grid2>
          <Grid2 size={screenSize.isMobile ? 12 : 6}>
            <Grid2
              container
              size={12}
              direction="column"
              gap={1}
              sx={{ position: 'relative' }}
            >
              {/* {profile.customClaims.role.includes(UserRole.MANAGER) ||
                (profile.customClaims.role.includes(UserRole.ADMIN) && ( */}
              <Tooltip title="Add group" placement="top">
                <IconButton
                  disableRipple
                  onClick={() =>
                    setModal({ add_trainer: false, add_group: true })
                  }
                  sx={{
                    p: 0,
                    m: 0,
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 100,
                  }}
                >
                  <Groups />
                </IconButton>
              </Tooltip>
              {/* ))} */}

              <Grid2
                size={6}
                display="flex"
                width="100%"
                overflow="auto"
                maxHeight="100% !important"
                sx={{
                  position: 'relative',
                  backgroundColor: theme.palette.background.paper,
                  px: 1,
                  py: 0.5,
                  borderTopRightRadius: '10px',
                  borderTopLeftRadius: '10px',

                  scrollbarWidth: 'thin',
                  scrollbarColor: '#515b68 transparent',
                  '&::-webkit-scrollbar': {
                    width: '4px',
                    height: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'background.default',
                  },
                }}
              >
                {selectedOrganization &&
                  selectedOrganization.groups.map((group) => {
                    const name = group.name || ''; // Ensure group.name exists
                    const isFirstTwoNumbers = /^\d{2}/.test(name); // Check if first two characters are numbers
                    const displayText = isFirstTwoNumbers
                      ? name.slice(0, 3)
                      : name.slice(0, 2);

                    return (
                      <IconButton
                        disableRipple
                        key={group.id}
                        onClick={() => {
                          setSelectedGroup(group);
                          if (group.cycles.length === 0) setSelectedCycle(null);
                          else setSelectedCycle(group.cycles[0]);
                        }}
                        sx={{
                          p: 0,
                          m: 0,
                        }}
                      >
                        <Box
                          display="flex"
                          flexDirection="column"
                          justifyContent="center"
                          alignItems="center"
                          maxWidth={100}
                        >
                          <Tooltip title={group.name} placement="top">
                            <Avatar
                              sx={{
                                width: AVATAR_SIZE,
                                height: AVATAR_SIZE,
                                m: 1,
                                bgcolor: 'primary.dark', // Set background color in case there's no image
                                border:
                                  selectedGroup?.id === group.id
                                    ? `3px solid ${theme.palette.primary.main}`
                                    : undefined,
                                color: '#fff',
                                fontSize: 15,
                              }}
                            >
                              {displayText.toUpperCase()}
                            </Avatar>
                          </Tooltip>
                          <Typography
                            variant="body1"
                            noWrap
                            sx={{
                              maxWidth: '100px', // Adjust as needed
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {group.name}
                          </Typography>
                        </Box>
                      </IconButton>
                    );
                  })}
              </Grid2>
              <Grid2
                size={6}
                display="flex"
                overflow="auto" // Hide scrollbar
                width="100%"
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderBottomLeftRadius: '10px',
                  borderBottomRightRadius: '10px',
                  px: 1,
                  py: 0.5,

                  scrollbarWidth: 'thin',
                  scrollbarColor: '#515b68 transparent',
                  '&::-webkit-scrollbar': {
                    width: '4px',
                    height: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'background.default',
                  },
                }}
              >
                {!selectedGroup?.cycles.length ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    width="100%"
                    sx={{ height: 85 }}
                  >
                    <Typography variant="h6">No cycles yet</Typography>
                  </Box>
                ) : (
                  selectedGroup?.cycles.map((cycle) => {
                    const displayText = cycle.name.slice(0, 2);

                    return (
                      <IconButton
                        disableRipple
                        key={cycle.id}
                        onClick={() => setSelectedCycle(cycle)}
                        sx={{
                          p: 0,
                          m: 0,
                        }}
                      >
                        <Box
                          display="flex"
                          flexDirection="column"
                          justifyContent="center"
                          alignItems="center"
                          maxWidth={100}
                        >
                          <Tooltip title={cycle.name} placement="top">
                            <Avatar
                              sx={{
                                width: AVATAR_SIZE,
                                height: AVATAR_SIZE,
                                m: 1,
                                bgcolor: 'primary.dark',
                                border:
                                  selectedCycle?.id === cycle.id
                                    ? `3px solid ${theme.palette.primary.main}`
                                    : undefined,
                                color: '#fff',
                                fontSize: 15,
                              }}
                            >
                              {displayText.toUpperCase()}
                            </Avatar>
                          </Tooltip>
                          <Typography
                            variant="body1"
                            noWrap
                            sx={{
                              maxWidth: '100px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {cycle.name}
                          </Typography>
                        </Box>
                      </IconButton>
                    );
                  })
                )}
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>
        {view === 'mainView' ? (
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
                    users={users}
                    selectedOrganization={selectedOrganization}
                  />
                </Grid2>
                <Grid2 size={screenSize.isMobile ? 12 : 6}>
                  <ReportsContainer
                    index={1}
                    reportTypes={[
                      DashboardReportType.CYCLE_PROGRESS,
                      DashboardReportType.TODAYS_SESSIONS,
                    ]}
                    users={users}
                    selectedOrganization={selectedOrganization}
                  />
                </Grid2>
              </Grid2>
              <Box
                width={screenSize.isSmallerThanLaptop ? '100%' : '50%'}
                margin="auto"
              >
                <DashboardChat profile={profile} />
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
                  users={users}
                  selectedOrganization={selectedOrganization}
                />
              </Grid2>
              <Grid2 size={3}>
                <ReportsContainer
                  index={1}
                  reportTypes={[DashboardReportType.CYCLE_PROGRESS]}
                  users={users}
                  selectedOrganization={selectedOrganization}
                />
              </Grid2>
              <Grid2 size={3}>
                <ReportsContainer
                  index={2}
                  reportTypes={[DashboardReportType.TODAYS_SESSIONS]}
                  users={users}
                  selectedOrganization={selectedOrganization}
                />
              </Grid2>
              <Grid2 size={3}>
                <DashboardChat profile={profile} />
              </Grid2>
            </Grid2>
          )
        ) : view === 'athletes' ? (
          <AthletesView
            groups={selectedOrganization?.groups || []}
            users={users}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
          />
        ) : (
          <></>
        )}
      </Box>
      <MyModal
        isOpen={modal.add_trainer}
        setIsOpen={(open) => setModal({ add_trainer: open, add_group: false })}
        onCancel={() => setModal({ add_trainer: false, add_group: false })}
        cancelText="Close"
        onConfirm={() => {
          setModal({ add_trainer: false, add_group: false });
        }}
      >
        <AddMembersModal
          title="Add Trainer"
          placeholder="Search trainers"
          users={users.filter((user) =>
            user.customClaims.role.includes(UserRole.TRAINER)
          )}
          members={selectedOrganization?.trainers || []}
          setMembers={setTrainers}
          addUserToEnd={true}
          dissableMaxWidth={true}
        />
      </MyModal>
      <MyModal
        isOpen={modal.add_group}
        setIsOpen={(open) => setModal({ add_trainer: false, add_group: open })}
        onCancel={() => {
          setModal({ add_trainer: false, add_group: false });
          setGroupName('');
        }}
        cancelText="Close"
        onConfirm={async () => {
          setModal({ add_trainer: false, add_group: false });
          setGroupName('');
          try {
            const group = await handleCreateGroupWithReturn(
              token,
              { name: groupName, membersIds: [profile.uid] },
              { router, setMembers: () => {} }
            );
            if (!group) {
              toast.error('Failed to create group.');
              return;
            }
            setSelectedOrganization({
              ...selectedOrganization!,
              groups: [...selectedOrganization!.groups, group],
            });
          } catch (error) {
            console.error(error);
            toast.error('Failed to create group.');
          }
        }}
      >
        <AddGroupModal groupName={groupName} setGroupName={setGroupName} />
      </MyModal>
    </>
  );
}
