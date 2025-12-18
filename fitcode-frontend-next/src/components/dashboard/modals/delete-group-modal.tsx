import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { InstitutionController } from '@/core/institution/institution.controller';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboardGroupActions } from '@/store/dashboard-group-actions.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';

export default function DeleteGroupModal() {
  const router = useRouter();
  const { setInstitution } = useMain();

  const {
    openDeleteGroupModal,
    setOpenDeleteGroupModal,
    groupToDelete,
    setGroupToDelete,
  } = useDashboardGroupActions();

  if (!groupToDelete) return null;

  return (
    <MyModal
      isOpen={openDeleteGroupModal}
      setIsOpen={(open) => setOpenDeleteGroupModal(open)}
      onCancel={() => {
        setOpenDeleteGroupModal(false);
        setGroupToDelete(null);
      }}
      cancelText="Close"
      onConfirm={async () => {
        handleApiRequest(
          router,
          () =>
            InstitutionController.getInstance().deleteGroup(
              groupToDelete.institutionId,
              groupToDelete.id
            ),
          () => {
            setInstitution((prev) =>
              !prev
                ? prev
                : {
                    ...prev,
                    groups: (prev.groups || []).filter(
                      (g) => g.id !== groupToDelete.id
                    ),
                  }
            );

            setOpenDeleteGroupModal(false);
            setGroupToDelete(null);
            toast.success('Group deleted successfully.');
          },
          undefined,
          'Failed to delete group.'
        );
      }}
    >
      <Box display="flex" justifyContent="center" alignItems="center">
        <Typography variant="h6" textAlign="center">
          Delete <b>{groupToDelete.name}</b>?
        </Typography>
      </Box>
    </MyModal>
  );
}
