import { core } from '@/core/core.service';
import { GroupController } from '@/core/group/group.controller';
import { ModalProps } from '@/lib/common/type/modal-props.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import MyModal from '@/ui/modal';
import { Box, Typography, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function DeleteGroupModal(props: ModalProps) {
  const router = useRouter();

  const { users, groups, setGroups } = useMain();
  const {
    selectedInstitution,
    setSelectedInstitution,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  const { open, setOpen } = props;

  if (!selectedGroup) return null;

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
          () => GroupController.getInstance().delete(selectedGroup.id),
          () => {
            setSelectedInstitution((prev) =>
              !prev
                ? prev
                : {
                    ...prev,
                    groups: (prev.groups || []).filter(
                      (g) => g.id !== selectedGroup.id
                    ),
                  }
            );

            setGroups((prev) => prev.filter((g) => g.id !== selectedGroup.id));

            const institutionTrainerGroup = (selectedInstitution?.groups || [])
              .filter((g) => g.id !== selectedGroup.id)
              .find((g) => groups.some((sg) => sg.id === g.id));

            setSelectedGroup(institutionTrainerGroup || null);
            setOpen(false);
            toast.success('Group deleted successfully.');
          },
          undefined,
          'Failed to delete group.'
        );
      }}
    >
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <Typography variant="h6" textAlign="center">
          Delete <b>{selectedGroup.name}</b>?
        </Typography>
      </Box>
    </MyModal>
  );
}
