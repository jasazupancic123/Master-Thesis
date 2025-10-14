import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { Superset, UpdateSuperset } from './superset.type';
import type { IdEntity } from '@/common/type/entity.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { MainSet } from '@/controller/training/enum/main-set.enum';

export type Subgroup = IdEntity & {
  name: string;
  membersIds: string[];
  supersets: Superset[];
  mainSet: MainSet;
  periodizationType?: PeriodizationType;
  parentId?: string;

  // mapped properties
  members?: AuthUser[];
};

export type UpdateSubgroup = Pick<
  Subgroup,
  'id' | 'name' | 'membersIds' | 'mainSet' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
};
