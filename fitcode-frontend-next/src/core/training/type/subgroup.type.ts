import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { Superset, UpdateSuperset } from './superset.type';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { IdEntity } from '@/core/entity.type';
import type { MainSet } from '@/core/training/enum/main-set.enum';

export type Subgroup = IdEntity & {
  name: string;
  membersIds: string[];
  supersets: Superset[];
  mainSet: MainSet;
  periodizationType?: PeriodizationType;
  parentId?: string;

  // mapped properties
  members?: AuthUser[];
  color?: string;
};

export type UpdateSubgroup = Pick<
  Subgroup,
  'id' | 'name' | 'membersIds' | 'mainSet' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
};
