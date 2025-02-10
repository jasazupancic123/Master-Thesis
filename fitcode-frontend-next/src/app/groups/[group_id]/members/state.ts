import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';
import { Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';

export function handleMembersSearchChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setSearchQueryMembers: SetState<string>
) {
  const query = e.target.value.toLowerCase();
  setSearchQueryMembers(query);
}

export function handleRemoveMember(
  user: User,
  members: User[],
  setMembers: SetState<User[]>,
  setFilteredMembers: Dispatch<SetStateAction<User[] | undefined>>
) {
  const updatedMembers = members.filter((m) => m.uid !== user.uid);
  setMembers(updatedMembers);
  setFilteredMembers(updatedMembers);
}

export async function handleUpdateMembers(
  token: string,
  members: User[],
  selectedGroup: Group,
  setSelectedGroup: SetState<Group>
) {
  const membersIds = members.map((member) => member.uid);

  if (
    membersIds.length === selectedGroup.membersIds.length &&
    membersIds.every((id) => selectedGroup.membersIds.includes(id))
  )
    return; // no changes

  handleApiRequest(
    () => GroupController.update(token, selectedGroup.id, { membersIds }),
    (newGroup) => {
      setSelectedGroup(newGroup);
      toast.success('Members updated successfully');
    }
  );
}
