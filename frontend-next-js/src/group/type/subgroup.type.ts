import { Subgroup } from '@/group/entity/subgroup.entity';

export type CreateSubgroup = Pick<Subgroup, 'name' | 'cycleId' | 'membersIds' | 'from' | 'to'>