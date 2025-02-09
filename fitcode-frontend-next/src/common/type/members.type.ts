import { User } from '@/controller/user/type/user.type';
import { useFetch } from '@/hook/use-fetch';

export type AddMembersModalProps = {
  users: ReturnType<typeof useFetch<User[]>>; // users, loading, error, fetchData, setData
  groupMembers: User[];
  setGlobalMembers: (members: User[]) => void;
  addUserToEnd: boolean;
};
