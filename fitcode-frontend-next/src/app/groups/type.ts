import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';

export interface Props {
  token: string;
  users: User[];
  groups: Group[];
}
