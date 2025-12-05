import type { Workload } from './workload.type';

export type ChartWorkloadData = Pick<
  Workload,
  'trainingId' | 'componentId' | 'exerciseId' | 'from'
> & {
  name: string;
  int?: number;
  vol?: number;
  intFullValue?: string;
  volFullValue?: string;
};
