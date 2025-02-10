import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { User } from '@/controller/user/type/user.type';
import toast from 'react-hot-toast';

export function filterMembers(
  members: User[],
  setFilteredMembers: SetState<User[]>,
  searchQueryMembers: string
) {
  setFilteredMembers(
    members.filter(
      (member) =>
        member.displayName?.toLowerCase().includes(searchQueryMembers) ||
        member.email.toLowerCase().includes(searchQueryMembers)
    )
  );
}

export function handleRemoveMember(
  user: User,
  members: User[],
  setMembers: SetState<User[]>,
  setFilteredMembers: SetState<User[]>
) {
  const updatedMembers = members.filter((m) => m.uid !== user.uid);
  setMembers(updatedMembers);
  setFilteredMembers(updatedMembers);
}

export async function handleCreateGroup(
  token: string,
  groupName: string,
  members: User[],
  setMembers: SetState<User[]>,
  setGroupName: SetState<string>
) {
  if (!groupName || groupName.length === 0)
    return toast.error('Please enter a group name.');

  if (!members || members.length === 0)
    return toast.error('Please add at least one member to the group.');

  const membersIds = members.map((member) => member.uid);

  handleApiRequest(
    () =>
      GroupController.create(token, {
        name: groupName,
        membersIds,
      }),
    (group) => {
      setMembers([]);
      setGroupName('');
      toast.success('Group created successfully.');
    },
    undefined,
    'Failed to create group.'
  );
}
