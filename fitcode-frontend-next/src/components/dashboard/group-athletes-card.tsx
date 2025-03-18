import { AddMembersModal } from '@/components/add-members-modal';
import BorderColor from '@/components/border-color';
import MyModal from '@/components/modal';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';
import { PersonAddAlt } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useScreenSize } from '@/context/screen-size-provider';

interface GroupAthletesCardProps {
  group: Group;
  users: User[];
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group) => void;
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
}

export default function GroupAthletesCard(props: GroupAthletesCardProps) {
  const {
    group,
    users,
    selectedGroup,
    setSelectedGroup,
    selectedUser,
    setSelectedUser,
  } = props;

  const screenSize = useScreenSize();

  const [groupMembers, setGroupMembers] = useState<User[]>(
    users.filter((user) => group.membersIds.includes(user.uid)).splice(0, 7) // only show first 7 users
  );
  const [modal, setModal] = useState<{ add_member: boolean }>({
    add_member: false,
  });

  useEffect(() => {
    if (selectedGroup === group) {
      setGroupMembers(
        users.filter((user) => group.membersIds.includes(user.uid)) // show all users
      );
    } else {
      setGroupMembers(
        users.filter((user) => group.membersIds.includes(user.uid)).splice(0, 7) // only show first 7 users
      );
    }
  }, [selectedGroup]);

  return (
    <Box
      key={group.id}
      display="flex"
      flexDirection="column"
      width="100%"
      sx={{
        borderTopRightRadius: '10px',
        borderTopLeftRadius: '10px',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          borderTopRightRadius: '10px',
          borderTopLeftRadius: '10px',
          py: 1,
          backgroundColor: 'primary.dark',
          textAlign: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => setSelectedGroup(group)}
      >
        <Tooltip title="Add athlete" placement="top">
          <IconButton
            onClick={() => setModal({ add_member: true })}
            sx={{
              m: 0,
              p: 0,
              position: 'absolute',
              top: 10,
              right: screenSize.isTablet ? 5 : 20,
            }}
          >
            <PersonAddAlt />
          </IconButton>
        </Tooltip>
        <Typography
          variant="h6"
          sx={{ fontSize: 18, maxWidth: screenSize.isTablet ? '50%' : '75%' }}
        >
          {group.name}
        </Typography>
      </Box>
      {groupMembers.map((member, i) => (
        <Typography
          key={member.uid}
          variant="body1"
          onClick={() => {
            if (selectedUser === member) {
              setSelectedUser(null);
              return;
            }
            setSelectedGroup(group);
            setSelectedUser(member);
          }}
          sx={{
            textAlign: 'center',
            width: '100%',
            py: 1,
            cursor: 'pointer',
            backgroundColor:
              selectedGroup === group && selectedUser === member
                ? 'primary.light'
                : undefined,
          }}
        >
          {member.displayName}
        </Typography>
      ))}

      <BorderColor
        lower
        color={selectedGroup === group ? 'primary.main' : 'primary.dark'}
      />
      <MyModal
        isOpen={modal.add_member}
        setIsOpen={(open) => setModal({ add_member: open })}
        onCancel={() => setModal({ add_member: false })}
        cancelText="Close"
      >
        <AddMembersModal
          users={users}
          members={groupMembers}
          setMembers={setGroupMembers}
          addUserToEnd={true}
        />
      </MyModal>
    </Box>
  );
}
