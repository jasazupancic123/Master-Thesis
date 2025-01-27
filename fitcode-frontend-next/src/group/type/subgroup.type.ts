import { Subgroup } from '@/group/entity/subgroup.entity';

export type CreateSubgroup = Pick<Subgroup, 'name' | 'membersIds' | 'from' | 'to'>

export type UpdateSubgroup = Partial<Pick<Subgroup, 'name' | 'membersIds'>>