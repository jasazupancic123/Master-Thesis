import { SetState } from '@/common/type/state.type';
import { User } from '@/controller/user/type/user.type';
import { Box, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useState } from 'react';
import { AddMembersModal } from '../add-members-modal/add-members-modal';
import MyModal from '../modal/modal';

interface UsersSelectListProps {
  allUsers: User[];
  selectedUsers: User[];
  setSelectedUsers: SetState<User[]>;
  title: string;
  addUsersTitle: string;
}

export default function UsersSelectList(props: UsersSelectListProps) {
  const { allUsers, selectedUsers, setSelectedUsers, title, addUsersTitle } =
    props;

  const theme = useTheme();

  const [modal, setModal] = useState(false);

  return (
    <>
      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        {title}
      </Typography>
      <Button variant="contained" onClick={() => setModal(true)}>
        {addUsersTitle}
      </Button>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        gap={1}
        borderRadius={1}
        bgcolor={theme.palette.primary.dark}
      >
        {selectedUsers.map((user) => (
          <Typography key={`${title}-${user.uid}`} textAlign="center">
            {user.displayName}
          </Typography>
        ))}
      </Box>
      
      <MyModal
        isOpen={modal}
        setIsOpen={(open) => setModal(true)}
        onCancel={() => setModal(false)}
        onConfirm={() => setModal(false)}
        cancelText="Close"
      >
        <AddMembersModal
          users={allUsers}
          members={selectedUsers}
          setMembers={setSelectedUsers}
          addUserToEnd={true}
        />
      </MyModal>
    </>
  );
}
