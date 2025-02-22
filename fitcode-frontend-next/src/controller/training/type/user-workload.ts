import { TimestampEntity } from '@/common/type/entity.type';
import { SetStatus } from '../enum/set-status.enum';
import { WorkloadType } from '../enum/workload-type.enum';

export type UserWorkload = TimestampEntity & {
  userId: string;
  trainingId: string;
  exerciseId: string;
  workloadType: WorkloadType;
  workloadValue: string | number; // calculated value prescribed by trainer
  sets: SetData[];
};

export interface SetData {
  status: SetStatus;
  setTypeValue?: number; // actual user reps / distance / time / ... completed
  workloadValue?: string | number; // actual user kg completed
  notes?: string;
}
