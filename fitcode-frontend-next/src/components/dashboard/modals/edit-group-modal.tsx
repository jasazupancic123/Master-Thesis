'use client';

import { TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { core } from '@/core/core.service';
import { InstitutionController } from '@/core/institution/institution.controller';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';

export default function EditGroupModal(props: ModalProps) {
  const router = useRouter();
  const { users, setGroups } = useMain();
  const {
    selectedGroup,
    setSelectedGroup,
    setSelectedInstitution,
    selectedInstitution,
  } = useDashboard();

  const { open, setOpen } = props;

  const [groupName, setGroupName] = useState<string>(selectedGroup?.name || '');

  useEffect(() => {
    setGroupName(selectedGroup?.name || '');
  }, [selectedGroup]);

  if (!selectedGroup || !selectedInstitution) return null;

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => {
        setOpen(false);
      }}
      cancelText="Close"
      onConfirm={async () => {
        const input = {
          name: groupName,
        };

        handleApiRequest(
          router,
          () =>
            InstitutionController.getInstance().updateGroup(
              selectedInstitution?.id,
              selectedGroup.id,
              input
            ),
          (group) => {
            group = core.group.mapMembers(group, users);

            setSelectedInstitution((prev) =>
              !prev
                ? prev
                : {
                    ...prev,
                    groups: (prev.groups || []).map((g) =>
                      g.id === group.id ? group : g
                    ),
                  }
            );

            setGroups((prev) =>
              prev.map((g) => (g.id === group.id ? group : g))
            );

            setSelectedGroup(group);
            setOpen(false);
            toast.success('Group updated successfully.');
          },
          undefined,
          'Failed to update group.'
        );
      }}
    >
      <TextField
        fullWidth
        value={groupName}
        label="Group Name"
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="Group Name"
        sx={{ mt: 2 }}
      />
    </MyModal>
  );
}
