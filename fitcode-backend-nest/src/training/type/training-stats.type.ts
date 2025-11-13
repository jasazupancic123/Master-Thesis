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
