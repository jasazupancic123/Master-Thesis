import { ColorEntity, IdEntity } from '@/common/type/entity.type';
import { User } from '@/controller/user/type/user.type';
import { Superset } from './training-plan.type';
import { AverageWorkloadValues } from './average-workload-values.type';

export type Subgroup = IdEntity &
  ColorEntity & {
    name: string;
    membersIds: string[];
    supersets: Superset[];
    avgFutureWorkloadValues: AverageWorkloadValues[]; // completed is stored on training only

    // mapped properties
    members?: User[];
  };
