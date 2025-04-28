import { User } from '@/controller/user/type/user.type';
import { SetState } from '../../common/type/state.type';
import { Organization } from '@/controller/organization/type/organization.type';
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
  selectedOrganization?: Organization | null;
  setSelectedOrganization?: SetState<Organization | null>;
};
