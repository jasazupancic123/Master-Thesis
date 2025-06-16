import { IdEntity } from '@/common/type/entity.type';
import { AverageWorkloadValues } from './average-workload-values.type';

export type SubgroupMinimal = IdEntity & {
  avgFutureWorkloadValues: AverageWorkloadValues[]; // completed is stored on training only
};
