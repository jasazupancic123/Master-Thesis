import type { PrescribedTrainingStats } from '../entity/training-stats.entity';
import type { TrainingStatus } from '../enum/training-status.enum';

export type TrainingStats = {
  status: TrainingStatus;
  trainingId: string;
  institutionId?: string;
  groupId?: string;
  cycleId?: string;
  prescribed: PrescribedTrainingStats;
  userId: string;
  from: Date;
  to: Date;
  duration: number;
  components: number;
  supersets: number;
  exercises: number;
  sets: number;
  reps: number;
  recTime: number;
  recDist: number;
  tut: number;
  tonnage: number;
  dist: number;
  time: number;
  realization: number;
};
