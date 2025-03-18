import { User } from '@/controller/user/type/user.type';
import { SetState } from '../../common/type/state.type';

export type AddMembersModalProps = {
  title?: string;
  placeholder?: string;
  users: User[];
  members: User[];
  setMembers: SetState<User[]> | ((members: User[]) => void);
  addUserToEnd: boolean;
  dissableMaxWidth?: boolean;
};
