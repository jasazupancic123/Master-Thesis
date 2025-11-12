import type { TrainingStatus } from '../enum/training-status.enum';
import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';
import type { DateRange } from '@/lib/common/type/date-range.type';

export type PrescribedTrainingStats = Omit<SetReport, 'load'> & {
  duration: number; // in minutes
  components: number;
  supersets: number;
  exercises: number; // unique
  sets: number;
};

export type SetReport = {
  reps: number;
  load: number; // in kg
  tut: number; // time under tension in seconds
  tonnage: number; // in kg
  time: number; // in seconds
  dist: number; // in meters
  recTime: number; // in seconds
  recDist: number; // in meters
};

export type TrainingStats = Required<DateRange> & {
  // meta
  institutionId?: string;
  institution?: Institution;
  groupId?: string;
  group?: Group;
  cycleId?: string;
  cycle?: Cycle;
  trainingId: string;
  userId: string;

  // report data
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
