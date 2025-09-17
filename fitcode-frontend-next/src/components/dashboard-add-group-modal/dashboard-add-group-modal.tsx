import { Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { AddMembersModal } from '../add-members-modal/add-members-modal';
import MyModal from '../modal/modal';
import type { SetState } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

interface AddGroupModalProps {
  groupName: string;
  setGroupName: (groupName: string) => void;
  owner: AuthUser | null;
  setOwner: SetState<AuthUser | null>;
}

export default function AddGroupModal(props: AddGroupModalProps) {
  const { users } = useMain();
  const { selectedInstitution } = useDashboard();

  const { owner, setOwner, groupName, setGroupName } = props;
  const [openModal, setOpenModal] = useState(false);
  const [allTrainers, _setAllTrainers] = useState(
    (users || []).filter((user) =>
      selectedInstitution?.trainerIds.includes(user.uid)
    )
  );

  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <Typography variant="h6">Add Group</Typography>
      </Box>
      <TextField
        id="outlined-basic"
        label="Group name"
        variant="outlined"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

      <Box
        display="flex"
        justifyContent="center"
        flexDirection={'column'}
        alignItems="center"
        gap={0.5}
      >
        <Typography variant="h6" sx={{ textAlign: 'center' }}>
          Owner{owner ? `: ${owner.displayName}` : ''}
        </Typography>
        <Button variant="contained" onClick={() => setOpenModal(true)}>
          {!owner ? 'Add owner' : 'Change owner'}
        </Button>
      </Box>

      <MyModal
        isOpen={openModal}
        setIsOpen={(open) => setOpenModal(open)}
        onCancel={() => setOpenModal(false)}
        onConfirm={() => setOpenModal(false)}
        cancelText="Close"
      >
        <AddMembersModal
          users={allTrainers}
          members={[]}
          setMembers={() => {}}
          addUserToEnd={true}
          setSingleMember={setOwner}
          singleMember={owner}
          enableFirstShowUsers
          enableScroll
        />
      </MyModal>
    </>
  );
}
