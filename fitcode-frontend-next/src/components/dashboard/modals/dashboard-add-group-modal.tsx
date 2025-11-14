import { Box, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { core } from '@/core/core.service';
import { GroupController } from '@/core/group/group.controller';
import type { Group } from '@/core/group/type/group.type';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import type { SetState } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';

interface Props extends ModalProps {
  setSelectedGroup: SetState<Group | null>;
}

export default function AddGroupModal(props: Props) {
  const router = useRouter();

  const { users, setGroups } = useMain();
  const { selectedInstitution, setSelectedInstitution, setDetectedChanges } =
    useDashboard();

  const { open, setOpen, setSelectedGroup } = props;

  const [groupName, setGroupName] = useState('');
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
          trainerIds: [selectedInstitution.trainerIds[0]],
          institutionId: selectedInstitution.id,
        };

        handleApiRequest(
          router,
          () => GroupController.getInstance().create(input),
          (group) => {
            group = core.group.mapMembers(group, users);

            setSelectedInstitution({
              ...selectedInstitution,
              groups: [...selectedInstitution.groups, group],
            });

            setGroups((prev) => [...prev, group]);

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
    </MyModal>
  );
}
