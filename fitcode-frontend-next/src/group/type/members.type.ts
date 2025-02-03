import { useFetch } from '@/hook/use-fetch';
import { User } from '@/user/type/user.type';

export type AddMembersModalProps = {
  users: ReturnType<typeof useFetch<User[]>>; // users, loading, error, fetchData, setData
  groupMembers: User[];
  setGlobalMembers: (members: User[]) => void;
  addUserToEnd: boolean;
};
