import type { AuthUser } from '@/controller/auth/type/user.type';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { Subgroup } from '@/controller/training/type/subgroup.type';

export const DEFAULT_SUBGROUP_ID = 'default';
export const ABSENT_SUBGRUP_ID = 'absent';

export const DEFAULT_SUBGROUP = (availableMembers: AuthUser[]): Subgroup => ({
  id: DEFAULT_SUBGROUP_ID,
  name: 'Main Group',
  color: '#9e9e9e',
  mainSet: MainSet.BLOCK,
  membersIds: availableMembers.map((user) => user.uid),
  supersets: [],
});

export const ABSENT_SUBGROUP = (): Subgroup => ({
  id: ABSENT_SUBGRUP_ID,
  name: 'Absent',
  color: '#454545',
  mainSet: MainSet.BLOCK,
  membersIds: [],
  supersets: [],
});
