import { Subgroup } from '../../training/entity/subgroup.entity';

export type CreateSubgroup = Pick<
  Subgroup,
  'name' | 'membersIds' | 'components'
>;

export type UpdateSubgroup = Partial<CreateSubgroup>;
