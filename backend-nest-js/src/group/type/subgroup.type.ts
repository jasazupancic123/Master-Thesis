import { Subgroup } from '../entity/subgroup.entity';

export type CreateSubgroup = Pick<
  Subgroup,
  'name' | 'from' | 'to' | 'membersIds'
>;

/**
 * Note - `from` cannot be updated, since it is equal to `createdAt`.
 */
export type UpdateSubgroup = Partial<CreateSubgroup>;
