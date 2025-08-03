import type { AfterSet } from '@/controller/component/type/after-set.type';
import type { MainSet } from '@/controller/component/type/main-set.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { TrainingExerciseAverageStats } from '@/controller/training/type/training-exercise-average-stats.type';
import type { User } from '@/controller/user/type/user.type';

export const MAX_WIDTH = '1340px';

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

export const DEFAULT_SUBGROUP_ID = 'default';
export const ABSENT_SUBGRUP_ID = 'absent';

export const DEFAULT_SUBGROUP = (
  availableMembers: User[],
  stats: TrainingExerciseAverageStats[]
): Subgroup => ({
  id: DEFAULT_SUBGROUP_ID,
  name: 'Main Group',
  color: '#9e9e9e',
  membersIds: availableMembers.map((user) => user.uid),
  prescribedStats: stats,
  supersets: [],
});

export const ABSENT_SUBGROUP = (): Subgroup => ({
  id: ABSENT_SUBGRUP_ID,
  name: 'Absent',
  color: '#454545',
  prescribedStats: [],
  membersIds: [],
  supersets: [],
});
