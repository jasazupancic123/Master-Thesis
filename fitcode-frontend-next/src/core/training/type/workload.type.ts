import type { SetStatus } from '../enum/set-status.enum';
import type {
  ExerciseSet,
  ExerciseSetPrimarySide,
  ExerciseSetSecondarySide,
} from './exercise-set.type';
import type { IdEntity } from '@/core/entity.type';

export type WorkloadMeta = IdEntity & {
  institutionId?: string;
  groupId?: string;
  cycleId?: string;
  userId: string;
  trainingId: string;
  componentId: string;
  exerciseId: string;
  setNumber: number;
  supersetIndex: number;
  status: SetStatus;
  notes?: string;
};

export type WorkloadPrimarySide = ExerciseSetPrimarySide & {
  rir?: number; // reps in reserve
  rom?: number; // in cm
  tempos?: string[]; // tempo for each rep
  roms?: number[]; // range of motion for each rep
  velocities?: number[]; // velocity for each rep
  feedback?: string[]; // feedback for each rep
};

export type WorkloadSecondarySide = ExerciseSetSecondarySide & {
  rirR?: number;
  romR?: number;
  temposR?: string[];
  romsR?: number[];
  velocitiesR?: number[];
  feedbackR?: string[];
};

export type WorkloadValue = WorkloadPrimarySide &
  WorkloadSecondarySide &
  Pick<ExerciseSet, 'eff' | 'recTime' | 'recDist' | 'time' | 'dist'> & {
    timestamp: Date;
    photoURLs?: string[];
  };

export type Workload = WorkloadMeta &
  WorkloadValue & {
    prescribed: ExerciseSet;
  };

export type UserProgress = {
  userId: string;
  id: string; // componentId
  completedSets: number; // component completed sets
  totalSets: number; // component total sets
  status: WorkloadStatus;
  exercises: {
    id: string; // exerciseId
    supersetIndex: number;
    completedSets: number;
    totalSets: number;
    status: WorkloadStatus;
  }[];
  lastTimestamp: Date;
};

export enum WorkloadStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export type CreateWorkload = Omit<
  Workload,
  | 'id'
  | 'setNumber'
  | 'institutionId'
  | 'groupId'
  | 'cycleId'
  | 'trainingId'
  | 'componentId'
  | 'exerciseId'
  | 'supersetIndex'
  | 'status'
  | 'prescribed'
  | 'loadBw'
  | 'loadBwR'
  | 'loadRm'
  | 'loadRmR'
>;
