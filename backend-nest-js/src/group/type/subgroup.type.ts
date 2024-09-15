import { Subgroup } from '../entity/subgroup.entity';

export type CreateSubgroup = Pick<
  Subgroup,
  'name' | 'from' | 'to' | 'membersIds' | 'cycleId'
>;

export type UpdateSubgroup = Partial<Pick<Subgroup, 'name' | 'membersIds'>>;
