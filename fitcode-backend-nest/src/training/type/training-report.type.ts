import type { DateRangeDto } from '@src/common/dto/date-range.dto';

import type { BaseAggregatedReport } from './training-set.type';

type Meta = {
  institutionId?: string;
  groupId?: string;
  cycleId?: string;
  trainingId: string;
  userId: string;
  from: Date;
  to: Date;
};

export type PrescribedTrainingComponentStats = BaseAggregatedReport & {
  componentId: string;
};

export type PrescribedTrainingStats = BaseAggregatedReport & {
  components: number;
};

export type TrainingComponentReport = Meta &
  PrescribedTrainingComponentStats & {
    prescribed: PrescribedTrainingComponentStats;
  };

export type TrainingReport = Meta &
  PrescribedTrainingStats & {
    prescribed: PrescribedTrainingStats;
  };

export type GroupTrainingReportItem = {
  attended: number;
  realization: number;
};

export type UserTrainingRealizationReportItem = DateRangeDto & {
  trainingId: string;
  componentId?: string;
  realization: number;
};
