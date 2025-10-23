import { Box, Button, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { AddMembersModal } from '@/components/dashboard/add-members-modal';
import type { AuthUser } from '@/core/auth/type/user.type';
import { GroupController } from '@/core/group/group.controller';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';

export default function AddGroupModal({ open, setOpen }: ModalProps) {
  const router = useRouter();

  const { users } = useMain();
  const {
    selectedInstitution,
    setSelectedInstitution,
    setSelectedGroup,
    setDetectedChanges,
  } = useDashboard();

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
        if (!owner) return toast.error('Please select an owner for the group.');

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
