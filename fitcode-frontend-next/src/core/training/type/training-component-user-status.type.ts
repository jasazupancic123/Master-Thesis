import type { TrainingStatus } from '../enum/training-status.enum';
import type { BaseEntity } from '@/core/entity.type';

export type TrainingComponentUserStatus = BaseEntity & {
  institutionId?: string;
  groupId?: string;
  cycleId?: string;
  trainingId: string;
  userId: string;
  componentId: string;
  status: TrainingStatus;
};
