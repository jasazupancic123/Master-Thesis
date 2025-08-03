import type { Workload } from './workload.type';

export type CompletedFutureWorkloads = {
  completedWorkloads: Workload[];
  futureWorkloads: Workload[];
};
