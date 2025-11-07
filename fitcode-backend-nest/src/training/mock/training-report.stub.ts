import { getTime } from '@src/common/utils/date.util';

import type { TrainingReport } from '../entity/training-report.entity';
import { TrainingStatus } from '../enum/training-status.enum';

export function generateTrainingReportStub(
  trainingId: string,
  userId: string,
  data?: Partial<TrainingReport>,
): TrainingReport {
  return {
    trainingId,
    userId,
    completed: data?.completed || false,
    realization: data?.realization || 0,
    muscleValues: data?.muscleValues || [],
    componentStatuses: data?.componentStatuses || [],
    photoURLs: data?.photoURLs || [],
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    from: data?.from || getTime(new Date(), 8, 0),
    to: data?.to || getTime(new Date(), 9, 0),
    status: data?.status || TrainingStatus.IN_PROGRESS,
    reps: data?.reps || 0,
    tut: data?.tut || 0,
    tonnage: data?.tonnage || 0,
    time: data?.time || 0,
    dist: data?.dist || 0,
    recTime: data?.recTime || 0,
    recDist: data?.recDist || 0,
    duration: data?.duration || 0,
    components: data?.components || 0,
    supersets: data?.supersets || 0,
    exercises: data?.exercises || 0,
    sets: data?.sets || 0,
    prescribed: data?.prescribed || {
      plannedComponents: [],
      reps: 0,
      tut: 0,
      tonnage: 0,
      time: 0,
      dist: 0,
      recTime: 0,
      recDist: 0,
      duration: 0,
      components: 0,
      supersets: 0,
      exercises: 0,
      sets: 0,
    },
  };
}
