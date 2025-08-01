import { TimestampEntity } from '@/common/type/entity.type';
import { SetStatus } from '../enum/set-status.enum';
import { PrescribedWorkload, WorkloadValue } from './workload-value.type';

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

export type CreatePrescribedWorkload = Pick<
  WorkloadMeta,
  | 'userId'
  | 'componentId'
  | 'exerciseId'
  | 'setNumber'
  | 'supersetIndex'
  | 'notes'
> &
  PrescribedWorkload;
