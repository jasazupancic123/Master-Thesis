import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';
import { Avatar, Box, Grid2, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import GroupAthletesCard from '@/components/dashboard/group-athletes-card';
import { COLOR } from '@/common/constant/browser.constant';
import BorderColor from '@/components/border-color';
import { useScreenSize } from '@/context/screen-size-provider';
import { useDashboard } from '@/context/dashboard-provider';
import { SetState } from '@/common/type/state.type';
import { Institution } from '@/controller/institution/type/institution.type';

interface AthletesViewProps {
  groups: Group[];
  users: User[];
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group) => void;
  selectedOrganization: Institution | null;
  setSelectedOrganization: SetState<Institution | null>;
}

export default function AthletesView(props: AthletesViewProps) {
  const screenSize = useScreenSize();
  const {
    groups,
    users,
    selectedGroup,
    setSelectedGroup,
    selectedOrganization,
    setSelectedOrganization,
  } = props;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { detectedChanges, setDetectedChanges } = useDashboard();

  useEffect(() => {
    if (
      selectedGroup &&
      selectedUser &&
      !selectedGroup.membersIds.includes(selectedUser?.uid || '')
    ) {
      setSelectedUser(null);
    }
  }, [selectedGroup]);

  return (
    <Grid2
      container
      width="100%"
      wrap="nowrap"
      gap={2}
      mt={2}
      direction={screenSize.isMobile ? 'column-reverse' : undefined}
    >
      <Grid2 size={screenSize.isMobile ? 12 : 3}>
        <Box display="flex" flexDirection="column" width="100%" gap={1}>
          {(screenSize.isMobile ? groups.slice().reverse() : groups).map(
            (group, i) =>
              i % 2 === 0 && (
                <GroupAthletesCard
                  key={`${group.id} ${i}`}
                  group={group}
                  users={users}
                  selectedGroup={selectedGroup}
                  setSelectedGroup={setSelectedGroup}
                  selectedUser={selectedUser}
                  setSelectedUser={setSelectedUser}
                  selectedOrganization={selectedOrganization}
                  setSelectedOrganization={setSelectedOrganization}
                />
              )
          )}
        </Box>
      </Grid2>
      <Grid2 size={screenSize.isMobile ? 12 : 3}>
        <Box display="flex" flexDirection="column" width="100%" gap={1}>
          {(screenSize.isMobile ? groups.slice().reverse() : groups).map(
            (group, i) =>
              i % 2 === 1 && (
                <GroupAthletesCard
                  key={`${group.id} ${i}`}
                  group={group}
                  users={users}
                  selectedGroup={selectedGroup}
                  setSelectedGroup={setSelectedGroup}
                  selectedUser={selectedUser}
                  setSelectedUser={setSelectedUser}
                  selectedOrganization={selectedOrganization}
                  setSelectedOrganization={setSelectedOrganization}
                />
              )
          )}
        </Box>
      </Grid2>
      <Grid2 size={screenSize.isMobile ? 12 : 6}>
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
      </Grid2>
    </Grid2>
  );
}
