import type { PrescribedTrainingStats } from '../entity/training-stats.entity';
import type { TrainingStatus } from '../enum/training-status.enum';

export type TrainingStats = {
  // meta
  institutionId?: string;
  groupId?: string;
  cycleId?: string;
  trainingId: string;
  userId: string;

  // stats data
  from: Date;
  to: Date;
  status: TrainingStatus;
  prescribed: PrescribedTrainingStats;
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
