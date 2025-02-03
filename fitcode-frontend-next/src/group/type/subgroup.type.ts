import { Subgroup } from '@/group/entity/subgroup.entity';
import { User } from '@/user/type/user.type';

export type CreateSubgroup = Pick<
  Subgroup,
  'name' | 'membersIds' | 'from' | 'to'
>;

export type UpdateSubgroup = Partial<Pick<Subgroup, 'name' | 'membersIds'>>;

export type SubgroupProps = {
  subgroups: Subgroup[];
  members: User[];
};