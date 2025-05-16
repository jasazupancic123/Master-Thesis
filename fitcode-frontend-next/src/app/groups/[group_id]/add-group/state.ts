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
