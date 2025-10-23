import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useDashboard } from '@/store/dashboard.provider';
import MyModal from '@/ui/modal';

export default function RemoveGroupModal({ open, setOpen }: ModalProps) {
  const { selectedGroup, deleteGroup } = useDashboard();

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      cancelText="Close"
      onCancel={() => setOpen(false)}
      onConfirm={async () => {
        if (!selectedGroup) return;
        await deleteGroup(selectedGroup.id!);
        setOpen(false);
      }}
    >
      Remove group <strong>{selectedGroup?.name}</strong>?
    </MyModal>
  );
}
