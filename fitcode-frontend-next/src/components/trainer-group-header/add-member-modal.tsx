import UsersDataGrid from '@/components/users-data-grid/users-data-grid';
import { UserRole } from '@/core/user/enum/user-role.enum';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import MyModal from '@/ui/modal';

export default function AddMemberModal(props: ModalProps) {
  const { open, setOpen } = props;

  const { group } = useGroup();

  const { users } = useMain();

  const trainerDayViewContext = useTrainerDayView();

  const { training, handleAddMember, handleRemoveMember } =
    trainerDayViewContext || {};

  if (!training || !handleAddMember || !handleRemoveMember) return null;

  return (
    <MyModal isOpen={open} setIsOpen={setOpen} title="Add member">
      <UsersDataGrid
        selectMode
        users={users.data}
        filter={(user) => user.role === UserRole.ATHLETE}
        displayColumns={['actions', 'photoURL', 'displayName', 'email']}
        initialSelection={(training || group)?.membersIds || []}
        onSelectToggle={async (user, selected) =>
          selected ? handleAddMember(user) : handleRemoveMember(user)
        }
      />
    </MyModal>
  );
}
