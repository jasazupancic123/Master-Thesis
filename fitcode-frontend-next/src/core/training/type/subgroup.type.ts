import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { Superset, UpdateSuperset } from './superset.type';
import type { IdEntity } from '@/core/entity.type';
import type { User } from '@/core/user/type/user.type';

export type Subgroup = IdEntity & {
  name: string;
  membersIds: string[];
  supersets: Superset[];
  periodizationType?: PeriodizationType;
  parentId?: string;

  // mapped properties
  members?: User[];
  color?: string;
};

export type UpdateSubgroup = Pick<
  Subgroup,
  'id' | 'name' | 'membersIds' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
};
