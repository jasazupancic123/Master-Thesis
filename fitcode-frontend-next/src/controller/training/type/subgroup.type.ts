import type { PeriodizationType } from '../enum/periodization-type.enum';
import type { Superset, UpdateSuperset } from './superset.type';
import type { ColorEntity, IdEntity } from '@/common/type/entity.type';
import type { User } from '@/controller/user/type/user.type';

export type Subgroup = IdEntity &
  ColorEntity & {
    name: string;
    membersIds: string[];
    supersets: Superset[];
    periodizationType?: PeriodizationType;

    // mapped properties
    members?: User[];
  };

export type UpdateSubgroup = Pick<
  Subgroup,
  'id' | 'name' | 'color' | 'membersIds' | 'periodizationType'
> & {
  supersets: UpdateSuperset[];
};
