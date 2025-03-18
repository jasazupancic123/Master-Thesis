import { handleApiRequest, SetState } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { User } from '@/controller/user/type/user.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';
import { CreateGroupInput } from '../../input';
import { Group } from '@/controller/group/type/group.type';

export function handleFilterMembers(state: {
  members: User[];
  setFilteredMembers: SetState<User[]>;
  search: string;
}) {
  const { members, setFilteredMembers, search } = state;

  setFilteredMembers(
    members.filter(
      (member) =>
        member.displayName?.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search)
    )
  );
}

export function handleRemoveMember(state: {
  user: User;
  members: User[];
  setMembers: SetState<User[]>;
  setFilteredMembers: SetState<User[]>;
}) {
  const { user, members, setMembers, setFilteredMembers } = state;
  const updatedMembers = members.filter((m) => m.uid !== user.uid);
  setMembers(updatedMembers);
  setFilteredMembers(updatedMembers);
}

export async function handleCreateGroup(
  token: string,
  input: CreateGroupInput,
  state: {
    router: AppRouterInstance;
    setMembers: SetState<User[]>;
  }
) {
  const { name, membersIds } = input;
  const { router, setMembers } = state;

  if (!name || name.length === 0)
    return toast.error('Please enter a group name.');

  if (!membersIds || membersIds.length === 0)
    return toast.error('Please add at least one member to the group.');

  handleApiRequest(
    router,
    () => GroupController.create(token, input),
    (_group) => {
      setMembers([]);
      toast.success('Group created successfully.');
    },
    undefined,
    'Failed to create group.'
  );
}

export async function handleCreateGroupWithReturn(
  token: string,
  input: CreateGroupInput,
  state: {
    router: AppRouterInstance;
    setMembers: SetState<User[]>;
  }
): Promise<Group | undefined> {
  const { name, membersIds } = input;
  const { router, setMembers } = state;

  if (!name || name.length === 0) {
    toast.error('Please enter a group name.');
    return;
  }

  if (!membersIds || membersIds.length === 0) {
    toast.error('Please add at least one member to the group.');
    return;
  }

  try {
    const group = await handleApiRequest(
      router,
      () => GroupController.create(token, input),
      (newGroup) => {
        setMembers([]);
        toast.success('Group created successfully.');
        return newGroup;
      },
      undefined,
      'Failed to create group.'
    );

    console.log('group:', group);

    return group;
  } catch (error) {
    console.error('Error creating group:', error);
    return undefined;
  }
}

