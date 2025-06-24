import { ColorEntity, IdEntity } from '@/common/type/entity.type';
import { User } from '@/controller/user/type/user.type';
import { Superset } from './training-plan.type';
import { GroupWorkloadStats } from './average-workload-values.type';
import { PeriodizationType } from '../enum/periodization-type.enum';

export type Subgroup = IdEntity &
  ColorEntity & {
    name: string;
    membersIds: string[];
    supersets: Superset[];
    futureStats: GroupWorkloadStats[]; // completed is stored on training only
    periodizationType?: PeriodizationType;

    // mapped properties
    members?: User[];
  };
