import { v4 } from 'uuid';

import type { TrainingComponentUserStatus } from '../entity/training-component-user-status.entity';
import { TrainingStatus } from '../enum/training-status.enum';

export function generateTrainingComponentUserStatusStub(
  trainingId: string,
  componentId: string,
  userId: string,
  data?: Partial<TrainingComponentUserStatus>,
): TrainingComponentUserStatus {
  return {
    id: data?.id ?? v4(),
    createdAt: data?.createdAt ?? new Date(),
    updatedAt: data?.updatedAt ?? new Date(),
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    trainingId,
    componentId,
    userId,
    status: data?.status ?? TrainingStatus.IN_PROGRESS,
  };
}
