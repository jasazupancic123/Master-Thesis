import { User } from '@/controller/user/type/user.type';
import {
  Avatar,
  Box,
  Grid2,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import GroupAthletesCard from '@/components/dashboard-group-athletes-card/dashboard-group-athletes-card';
import { COLOR } from '@/common/constant/browser.constant';
import BorderColor from '@/components/border-color/border-color';
import { useScreenSize } from '@/store/screen-size-provider';
import { useDashboard } from '@/store/dashboard-provider';
import { useTheme } from '@mui/material';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { Add } from '@mui/icons-material';
import MyModal from '../modal/modal';
import { handleApiRequest } from '@/common/type/state.type';
import { useRouter } from 'next/navigation';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { InstitutionService } from '@/controller/institution/institution.service';
import toast from 'react-hot-toast';
import DashboardAthlete from '../dashboard-athlete/dashboard-athlete';
import { isManager } from '@/common/service/util/firebase-auth.util';
import RegisterUsersDashboard from '../dashboard-register-users-modal/dashboard-register-users-modal';
import { GroupService } from '@/controller/group/group.service';

export default function AthletesView() {
  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();

  const {
    token,
    users,
    profile,
    selectedGroup,
    selectedInstitution,
    setSelectedInstitution,
  } = useDashboard();

  const role = profile?.customClaims?.role || [];

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modal, setModal] = useState({
    add_athlete: false,
  });
  const [addedAthletes, setAddedAthletes] = useState<User[]>(
    selectedInstitution?.athletes || []
  );

  /* useEffect(() => {
    if (!selectedInstitution) return;
    setAddedAthletes(selectedInstitution.athletes || []);
  }, [selectedInstitution]); */

  const handleAddAthletesToInstitution = () => {
    if (!selectedInstitution || !addedAthletes.length) return;

    const athleteIds = addedAthletes
      .filter(
        (athlete) =>
          !selectedInstitution?.athletes?.some((a) => a.uid === athlete.uid)
      )
      .map((athlete) => athlete.uid);

    handleApiRequest(
      router,
      () =>
        InstitutionController.addAthletes(token, selectedInstitution.id, {
          athleteIds,
        }),
      (institution) => {
        institution = InstitutionService.mapUsers(
          [institution],
          users || []
        )[0];
        setSelectedInstitution(institution);
        setModal((prev) => ({ ...prev, add_athlete: false }));
        toast.success('Athletes added successfully');
      },
      undefined,
      'Failed to add athletes'
    );
  };

  useEffect(() => {
    if (
      selectedGroup &&
      selectedUser &&
      !selectedGroup.membersIds.includes(selectedUser?.uid || '')
    ) {
      setSelectedUser(null);
    }
  }, [selectedGroup]);

  if (!selectedInstitution) return null;

  return (
    <>
      <Stack
        direction="row"
        justifyContent="flex-start"
        width="100%"
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '10px',
          p: 1,
          mt: 1,
          overflowX: 'auto',
        }}
      >
        {isManager(role) && (
          <Tooltip title="Add athlete">
            <Avatar
              key={'add'}
              sx={{
                width: 30,
                height: 30,
                marginY: 'auto',
                cursor: 'pointer',
                backgroundColor: theme.palette.primary.main,
              }}
              onClick={() => {
                setModal((prev) => ({
                  ...prev,
                  add_athlete: true,
                }));
              }}
            >
              <Add />
            </Avatar>
          </Tooltip>
        )}
        {selectedInstitution?.athletes &&
          selectedInstitution.athletes.map((a) => (
            <DashboardAthlete
              key={a.uid}
              athlete={a}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
            />
          ))}
      </Stack>
      <Grid2
        container
        width="100%"
        wrap="nowrap"
        gap={2}
        mt={2}
        direction={screenSize.isMobile ? 'column-reverse' : undefined}
      >
        {!selectedInstitution.groups?.length ? (
          <Grid2 size={screenSize.isMobile ? 12 : 6}>
            <Typography variant="h6" textAlign="center" width="100%">
              No groups available. Create a group to add athletes.
            </Typography>
          </Grid2>
        ) : (
          <>
            <Grid2 size={screenSize.isMobile ? 12 : 3}>
              <Box display="flex" flexDirection="column" width="100%" gap={1}>
                {(screenSize.isMobile
                  ? selectedInstitution.groups.slice().reverse()
                  : selectedInstitution.groups
                ).map(
                  (group, i) =>
                    i % 2 === 0 && (
                      <GroupAthletesCard
                        key={`${group.id} ${i}`}
                        group={
                          users
                            ? GroupService.mapMembers(group, users, true)
                            : group
                        }
                        selectedUser={selectedUser}
                        setSelectedUser={setSelectedUser}
                      />
                    )
                )}
              </Box>
            </Grid2>
            <Grid2 size={screenSize.isMobile ? 12 : 3}>
              <Box display="flex" flexDirection="column" width="100%" gap={1}>
                {(screenSize.isMobile
                  ? selectedInstitution.groups.slice().reverse()
                  : selectedInstitution.groups
                ).map(
                  (group, i) =>
                    i % 2 === 1 && (
                      <GroupAthletesCard
                        key={`${group.id} ${i}`}
                        group={
                          users
                            ? GroupService.mapMembers(group, users, true)
                            : group
                        }
                        selectedUser={selectedUser} /*  */
                        setSelectedUser={setSelectedUser}
                      />
                    )
                )}
              </Box>
            </Grid2>
          </>
        )}
        <Grid2 size={screenSize.isMobile ? 12 : 6}>
          {!selectedUser ? (
            <Typography variant="h6" textAlign="center" width="100%">
              Select a user to view their details.
            </Typography>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              width="100%"
              bgcolor="background.paper"
            >
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                  borderTopRightRadius: '10px',
                  borderTopLeftRadius: '10px',
                  py: 1,
                  backgroundColor: COLOR[0],
                  textAlign: 'center',
                  position: 'relative',
                  minHeight: 45,
                }}
              >
                <Typography variant="h6" sx={{ fontSize: 18, maxWidth: '75%' }}>
                  {selectedUser?.displayName || ''}
                </Typography>
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                gap={2}
                width={screenSize.isTablet ? '75%' : '33%'}
                margin="auto"
                justifyContent="center"
                alignItems="center"
                sx={{
                  py: 2,
                }}
              >
                <Avatar
                  className="avatar-border"
                  src={'/user_avatar.png'}
                  sx={{
                    width: 80,
                    height: 80,
                  }}
                />
                <TextField
                  disabled
                  label="Name"
                  value={selectedUser?.displayName || ''}
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'white',
                    },
                  }}
                />
                <TextField
                  disabled
                  label="Email"
                  value={selectedUser?.email || ''}
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'white',
                    },
                  }}
                />
              </Box>
              <BorderColor lower color={COLOR[0]} />
            </Box>
          )}
        </Grid2>
      </Grid2>
      <MyModal
        isOpen={modal.add_athlete}
        setIsOpen={(open) =>
          setModal((prev) => ({ ...prev, add_athlete: open }))
        }
        onConfirm={undefined}
        onCancel={() => setModal((prev) => ({ ...prev, add_athlete: false }))}
      >
        <RegisterUsersDashboard registerRole={UserRole.ATHLETE} />
      </MyModal>
    </>
  );
}
