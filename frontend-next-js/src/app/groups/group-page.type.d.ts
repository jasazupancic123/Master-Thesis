import { User } from '@/type/user.type';

export type GroupPage = {
  users: User[],
  setUsers: (users: User[]) => void | Promise<void>,
}