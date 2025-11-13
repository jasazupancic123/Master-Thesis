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
    from: data?.from ?? new Date(),
    to: data?.to ?? new Date(),
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    trainingId,
    componentId,
    userId,
    status: data?.status ?? TrainingStatus.IN_PROGRESS,
    realization: data?.realization ?? 0,
    reps: data?.reps ?? 0,
    dist: data?.dist ?? 0,
    time: data?.time ?? 0,
    exercises: data?.exercises ?? 0,
    sets: data?.sets ?? 0,
    tonnage: data?.tonnage ?? 0,
    tut: data?.tut ?? 0,
    recTime: data?.recTime ?? 0,
    recDist: data?.recDist ?? 0,
  };
}
