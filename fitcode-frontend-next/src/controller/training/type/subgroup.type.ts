import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { Superset, UpdateSuperset } from './superset.type';
import type { ColorEntity, IdEntity } from '@/common/type/entity.type';
import type { MainSet } from '@/controller/training/enum/main-set.enum';
import type { User } from '@/controller/user/type/user.type';

export type Subgroup = IdEntity &
  ColorEntity & {
    name: string;
    membersIds: string[];
    supersets: Superset[];
    mainSet: MainSet;
    periodizationType?: PeriodizationType;

    // mapped properties
    members?: User[];
  };

export type UpdateSubgroup = Pick<
  Subgroup,
  'id' | 'name' | 'color' | 'membersIds' | 'periodizationType' | 'mainSet'
> & {
  supersets: UpdateSuperset[];
};
