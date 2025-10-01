import type { SetStatus } from '../enum/set-status.enum';
import type { WorkloadValue } from './workload-value.type';
import type { TimestampEntity } from '@/common/type/entity.type';

export type Workload = TimestampEntity & WorkloadMeta & WorkloadValue;

export type WorkloadMeta = {
  institutionId?: string;
  groupId?: string;
  cycleId?: string;
  userId: string;
  trainingId: string;
  componentId: string;
  exerciseId: string;
  setNumber: number;
  supersetIndex: number;
  status: SetStatus;
  plannedAt: Date;
  notes?: string;
};
