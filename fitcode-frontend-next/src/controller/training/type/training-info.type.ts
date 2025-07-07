import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity } from '@/common/type/entity.type';
import { TrainingComponentInfo } from './training-plan.type';
import { GroupWorkloadStats } from './average-workload-values.type';

export type TrainingInfo = BaseEntity &
  Required<DateRange> & {
    institutionId?: string;
    groupId?: string;
    cycleId?: string;
    copiedFromId?: string;
    warmup: TrainingComponentInfo;
    cooldown: TrainingComponentInfo;
    components: TrainingComponentInfo[];
    stats: GroupWorkloadStats[];
    futureStats: GroupWorkloadStats[];
  };
