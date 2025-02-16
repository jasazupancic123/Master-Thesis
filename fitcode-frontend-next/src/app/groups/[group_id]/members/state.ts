import {
  handleApiRequest,
  SetState,
  SetStateNullable,
} from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export function handleRemoveMember(state: {
  user: User;
  members: User[];
  setMembers: SetState<User[]>;
  setFilteredMembers: SetStateNullable<User[]>;
}) {
  const { user, members, setMembers, setFilteredMembers } = state;
  const updatedMembers = members.filter((m) => m.uid !== user.uid);
  setMembers(updatedMembers);
  setFilteredMembers(updatedMembers);
}

export async function handleUpdateMembers(
  token: string,
  input: User[],
  state: {
    router: AppRouterInstance;
    group: Group;
    setGroup: SetState<Group>;
  }
) {
  const { router, group, setGroup } = state;

  const membersIds = input.map((member) => member.uid);
  if (
    membersIds.length === group.membersIds.length &&
    membersIds.every((id) => group.membersIds.includes(id))
  )
    return; // no changes

  handleApiRequest(
    router,
    () => GroupController.update(token, group.id, { membersIds }),
    (newGroup) => {
      setGroup((prev) => ({ ...prev, membersIds: newGroup.membersIds }));
      toast.success('Members updated successfully');
    }
  );
}
