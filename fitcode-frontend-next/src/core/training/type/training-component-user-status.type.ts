import type { TrainingStatus } from '../enum/training-status.enum';
import type { BaseEntity } from '@/core/entity.type';
import type { DateRange } from '@/lib/common/type/date-range.type';

export type TrainingComponentUserStatus = BaseEntity &
  DateRange & {
    institutionId?: string;
    groupId?: string;
    cycleId?: string;
    trainingId: string;
    userId: string;
    componentId: string;
    status: TrainingStatus;
    realization: number;
    reps: number;
    tut: number;
    tonnage: number;
    time: number;
    dist: number;
    recTime: number;
    recDist: number;
    exercises: number;
    sets: number;
  };
