import { Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { AddMembersModal } from '../../../modals/add-members-modal';
import MyModal from '../../../../../util/modal/modal';
import { handleApiRequest } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { ModalProps } from '@/common/type/modal-props.type';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { GroupController } from '@/controller/group/group.controller';

export default function AddGroupModal(props: ModalProps) {
  const router = useRouter();

  const { users } = useMain();
  const {
    selectedInstitution,
    setSelectedInstitution,
    setSelectedGroup,
    setDetectedChanges,
  } = useDashboard();

  const { open, setOpen } = props;

  const [groupName, setGroupName] = useState('');
  const [owner, setOwner] = useState<AuthUser | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [allTrainers, _setAllTrainers] = useState(
    (users || []).filter((user) =>
      selectedInstitution?.trainerIds.includes(user.uid)
    )
  );

  const controller = GroupController.getInstance();

  if (!selectedInstitution) return null;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => {
        setOpen(false);
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
            setOpen(false);
            setGroupName('');
            setDetectedChanges(false);
            toast.success('Group created successfully.');
          },
          undefined,
          'Failed to create group.'
        );
      }}
    >
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
          open={openModal}
          setOpen={setOpenModal}
        />
      </MyModal>
    </MyModal>
  );
}
