import { IdEntity } from '@/common/type/entity.type';
import { GroupWorkloadStats } from './average-workload-values.type';

export type SubgroupInfo = IdEntity & {
  futureStats: GroupWorkloadStats[]; // completed is stored on training only
};
