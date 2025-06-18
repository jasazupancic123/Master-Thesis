import { AfterSet } from '@/controller/component/type/after-set.type';
import { MainSet } from '@/controller/component/type/main-set.type';
import { GroupWorkloadStats } from '@/controller/training/type/average-workload-values.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { User } from '@/controller/user/type/user.type';

export const NUM_MAX_SUPERSETS = 8;

export const NUM_MAX_EXERCISES_PER_SUPERSET = 4;

export const MAIN_SETS: MainSet[] = [
  { id: '1', name: 'Circuit' },
  { id: '2', name: 'Block' },
];

export const AFTER_SETS: AfterSet[] = [
  { id: '1', name: 'Plus Sets' },
  { id: '2', name: 'Joker Sets' },
  { id: '3', name: 'Back-Off Sets' },
  { id: '4', name: 'Myo Reps' },
  { id: '5', name: 'Dynamic Effort' },
  { id: '6', name: 'Issometric' },
];

export const DEFAULT_SUBGROUP = (
  availableMembers: User[],
  stats: GroupWorkloadStats[]
): Subgroup => ({
  id: 'default',
  name: 'Main Group',
  color: '#9e9e9e',
  membersIds: availableMembers.map((user) => user.uid),
  futureStats: stats,
  supersets: [],
});

export const ABSENT_SUBGRUP = (): Subgroup => ({
  id: 'absent',
  name: 'Absent',
  color: '#454545',
  futureStats: [],
  membersIds: [],
  supersets: [],
});
