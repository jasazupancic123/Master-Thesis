import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';

export type BaseReport = {
  reps: number;
  tut: number; // total time under tension
  tonnage: number;
  time: number;
  dist: number;
  recTime: number;
  recDist: number;
};

export type BaseAggregatedReport = BaseReport & {
  realization: number;
  exercises: number;
  sets: number;
};

export type SetReport = BaseReport & {
  load: number; // in kg
};

type Meta = {
  institutionId?: string;
  institution?: Institution;
  groupId?: string;
  group?: Group;
  cycleId?: string;
  cycle?: Cycle;
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
