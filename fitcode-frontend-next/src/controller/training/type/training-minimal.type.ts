import { DateRange } from '@/common/type/date-range.type';
import { BaseEntity } from '@/common/type/entity.type';
import { TrainingComponentMinimal } from './training-plan.type';
import { AverageWorkloadValues } from './average-workload-values.type';

export type TrainingMinimal = BaseEntity &
  Required<DateRange> & {
    groupId: string;
    cycleId: string;
    copiedFromId?: string;
    warmup: TrainingComponentMinimal;
    cooldown: TrainingComponentMinimal;
    components: TrainingComponentMinimal[];
    avgCompletedWorkloadValues: AverageWorkloadValues[];
    avgFutureWorkloadValues: AverageWorkloadValues[];
  };
