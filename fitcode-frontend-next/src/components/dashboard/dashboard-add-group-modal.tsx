import { Box, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { AddMembersModal } from '@/components/dashboard/add-members-modal';
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
  const [openModal, setOpenModal] = useState(false);
  const [allTrainers, _setAllTrainers] = useState(
    (users || []).filter((user) =>
      selectedInstitution?.trainerIds.includes(user.uid)
    )
  );

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
        const owner = allTrainers.find(
          (trainer) => trainer.uid === selectedInstitution.trainerIds[0]
        );

        if (!owner) return toast.error('Please select an owner for the group.');

        const input = {
          name: groupName,
          membersIds: [],
          ownerId: selectedInstitution.trainerIds[0],
          institutionId: selectedInstitution.id,
        };

        handleApiRequest(
          router,
          () => GroupController.getInstance().create(input),
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

      <MyModal
        isOpen={openModal}
        setIsOpen={(open) => setOpenModal(open)}
        onCancel={() => setOpenModal(false)}
        onConfirm={() => setOpenModal(false)}
        cancelText="Close"
      >
        <AddMembersModal
          users={allTrainers}
          enableFirstShowUsers
          enableScroll
          open={openModal}
          setOpen={setOpenModal}
        />
      </MyModal>
    </MyModal>
  );
}
