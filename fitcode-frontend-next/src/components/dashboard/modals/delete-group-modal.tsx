import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { InstitutionController } from '@/core/institution/institution.controller';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';

export default function DeleteGroupModal(props: ModalProps) {
  const router = useRouter();
  const { setInstitution } = useMain();
  const { selectedGroups, setSelectedGroups } = useDashboard();

  const { open, setOpen } = props;

  if (selectedGroups.length !== 1) return null;

  const selectedGroup = selectedGroups[0];

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => {
        setOpen(false);
      }}
      cancelText="Close"
      onConfirm={async () => {
        handleApiRequest(
          router,
          () =>
            InstitutionController.getInstance().deleteGroup(
              selectedGroup.institutionId,
              selectedGroup.id
            ),
          () => {
            setInstitution((prev) =>
              !prev
                ? prev
                : {
                    ...prev,
                    groups: (prev.groups || []).filter(
                      (g) => g.id !== selectedGroup.id
                    ),
                  }
            );

            setSelectedGroups((prev) =>
              prev.filter((g) => g.id !== selectedGroup.id)
            );
            setOpen(false);
            toast.success('Group deleted successfully.');
          },
          undefined,
          'Failed to delete group.'
        );
      }}
    >
      <Box display="flex" justifyContent="center" alignItems="center">
        <Typography variant="h6" textAlign="center">
          Delete <b>{selectedGroup.name}</b>?
        </Typography>
      </Box>
    </MyModal>
  );
}
