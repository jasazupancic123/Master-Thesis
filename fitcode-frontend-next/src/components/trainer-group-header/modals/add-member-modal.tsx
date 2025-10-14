import type { ModalProps } from '@/common/type/modal-props.type';
import UsersDataGrid from '@/components/users-data-grid/users-data-grid';
import { UserRole } from '@/controller/profile/enum/user-role.enum';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import MyModal from '@/util/modal/modal';

export default function AddMemberModal(props: ModalProps) {
  const { open, setOpen } = props;

  const { group } = useGroup();

  const { users } = useMain();

  const trainerDayViewContext = useTrainerDayViewContext();

  const { training, handleAddMember, handleRemoveMember } =
    trainerDayViewContext || {};

  if (!training || !handleAddMember || !handleRemoveMember) return null;

  return (
    <MyModal isOpen={open} setIsOpen={setOpen} title="Add member">
      <UsersDataGrid
        selectMode
        users={users}
        filter={(user) => user.customClaims.role[0] === UserRole.ATHLETE}
        displayColumns={['actions', 'photoURL', 'displayName', 'email']}
        initialSelection={(training || group)?.membersIds || []}
        onSelectToggle={async (user, selected) =>
          selected ? handleAddMember(user) : handleRemoveMember(user)
        }
      />
    </MyModal>
  );
}
