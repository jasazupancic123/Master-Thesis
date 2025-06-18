import { Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import MyModal from '../modal/modal';
import { AddMembersModal } from '../add-members-modal/add-members-modal';
import { User } from '@/controller/user/type/user.type';
import { useDashboard } from '@/store/dashboard-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { SetState } from '@/common/type/state.type';

interface AddGroupModalProps {
  groupName: string;
  setGroupName: (groupName: string) => void;
  owner: User | null;
  setOwner: SetState<User | null>;
}

export default function AddGroupModal(props: AddGroupModalProps) {
  const { selectedInstitution, users } = useDashboard();

  const { owner, setOwner, groupName, setGroupName } = props;
  const [openModal, setOpenModal] = useState(false);
  const [allTrainers, setAllTrainers] = useState(
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
        />
      </MyModal>
    </>
  );
}
