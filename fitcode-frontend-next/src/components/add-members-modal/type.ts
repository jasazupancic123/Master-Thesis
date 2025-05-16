import { User } from '@/controller/user/type/user.type';
import { SetState } from '../../common/type/state.type';
import { Institution } from '@/controller/institution/type/institution.type';
import { Group } from '@/controller/group/type/group.type';

export type AddMembersModalProps = {
  title?: string;
  placeholder?: string;
  users: User[];
  members: User[];
  setMembers: SetState<User[]> | ((members: User[]) => void);
  addUserToEnd: boolean;
  dissableMaxWidth?: boolean;
  dashboardView?: boolean;
  group?: Group;
  selectedInstitution?: Institution | null;
  setSelectedInstitution?: SetState<Institution | null>;
  singleMember?: User | null; // for single member selection
  setSingleMember?: SetState<User | null>; // for single member selection
};
