import { AfterSet } from '@/controller/component/type/after-set.type';
import { MainSet } from '@/controller/component/type/main-set.type';
import { Method } from '@/controller/component/type/method.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { User } from '@/controller/user/type/user.type';

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

export const METHODS: Method[] = [
  { id: '1', name: 'Dynamic Stretching' },
  { id: '2', name: 'Static Stretching' },
  { id: '3', name: 'Joint Circles and Mobility Drills' },
  { id: '4', name: 'Active Isolated Stretching' },
  { id: '5', name: 'Yoga' },
  { id: '6', name: 'PNF Stretching' },
  { id: '7', name: 'Foam Rolling' },
];

export const DEFAULT_SUBGROUP = (availableMembers: User[]): Subgroup => ({
  id: 'default',
  name: 'Main Group',
  color: '#9e9e9e',
  membersIds: availableMembers.map((user) => user.uid),
  supersets: [],
});
