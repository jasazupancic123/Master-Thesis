import { ModalProps } from '@/common/type/modal-props.type';
import { useDashboard } from '@/store/dashboard.provider';
import MyModal from '@/util/modal/modal';
import { handleRemoveSelectedGroup } from '../../actions/actions-group';
import { useRouter } from 'next/navigation';
import { GroupController } from '@/controller/group/group.controller';

export default function RemoveGroupModal(props: ModalProps) {
  const router = useRouter();

  const dashboardContext = useDashboard();

  const { selectedGroup } = dashboardContext;
  const { open, setOpen } = props;

  const controller = GroupController.getInstance();

  // modal.remove_group

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      onCancel={() => setOpen(false)}
      onConfirm={() => {
        handleRemoveSelectedGroup(
          { router, controller },
          { useDashboard: dashboardContext }
        );
        setOpen(false);
      }}
      cancelText="Close"
    >
      Remove group <strong>{selectedGroup?.name}</strong>?
    </MyModal>
  );
}
