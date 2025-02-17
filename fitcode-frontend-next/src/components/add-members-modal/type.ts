import { User } from '@/controller/user/type/user.type';
import { SetState } from '../../common/type/state.type';

export type AddMembersModalProps = {
  users: User[];
  members: User[];
  setMembers: SetState<User[]>;
  addUserToEnd: boolean;
};
