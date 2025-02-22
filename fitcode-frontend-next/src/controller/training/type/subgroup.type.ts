import { ColorEntity, IdEntity } from '@/common/type/entity.type';
import { User } from '@/controller/user/type/user.type';
import { Superset } from './training-plan.type';

export type Subgroup = IdEntity &
  ColorEntity & {
    name: string;
    membersIds: string[];
    supersets: Superset[];

    // mapped properties
    members?: User[];
  };
