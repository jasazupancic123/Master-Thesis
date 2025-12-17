'use client';

import { Box, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { core } from '@/core/core.service';
import { InstitutionController } from '@/core/institution/institution.controller';
import type { UpdateGroup } from '@/core/institution/type/group.type';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';
import { useDashboardGroupActions } from '@/store/dashboard-group-actions.provider';

export default function EditGroupModal() {
  const router = useRouter();
  const { users, setInstitution } = useMain();
  const { groupToEdit, openEditGroupModal, setOpenEditGroupModal } =
    useDashboardGroupActions();

  const [groupName, setGroupName] = useState<string>(
    groupToEdit ? groupToEdit.name : ''
  );
  const [shortName, setShortName] = useState<string>(
    groupToEdit ? groupToEdit.shortName : ''
  );

  useEffect(() => {
    if (!groupToEdit) return;

    setGroupName(groupToEdit?.name || '');
    setShortName(groupToEdit?.shortName || '');
  }, [groupToEdit]);

  if (!groupToEdit) return null;

  return (
    <MyModal
      isOpen={openEditGroupModal}
      setIsOpen={(open) => setOpenEditGroupModal(open)}
      onCancel={() => {
        setOpenEditGroupModal(false);
      }}
      cancelText="Close"
      onConfirm={async () => {
        const input: UpdateGroup = {
          name: groupName,
          shortName: shortName,
        };

        handleApiRequest(
          router,
          () =>
            InstitutionController.getInstance().updateGroup(
              groupToEdit.institutionId,
              groupToEdit.id,
              input
            ),
          (group) => {
            group = core.group.mapMembers(group, users.data);

            setInstitution((prev) =>
              !prev
                ? prev
                : {
                    ...prev,
                    groups: (prev.groups || []).map((g) =>
                      g.id === group.id ? group : g
                    ),
                  }
            );

            setOpenEditGroupModal(false);
            toast.success('Group updated successfully.');
          },
          undefined,
          'Failed to update group.'
        );
      }}
    >
      <Box display="flex" flexDirection="column">
        <TextField
          value={groupName}
          label="Group Name"
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
          sx={{ mt: 2 }}
        />
        <TextField
          size="small"
          value={shortName}
          label="Short Name"
          onChange={(e) => setShortName(e.target.value)}
          placeholder="Short Name"
          sx={{ mt: 2 }}
        />
      </Box>
    </MyModal>
  );
}
