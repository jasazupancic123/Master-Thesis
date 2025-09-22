import type { WorkloadMeta } from './workload.type';
import type { DateRange } from '@/common/type/date-range.type';

export type CompleteLSet = {
  reps?: number;
  time?: number; // in s
  dist?: number; // in m
  load?: number; // in kg
  rom?: number; // in cm
  velocity?: number; // in m/s
  tempo?: number; // e.g. 2010 (for 2:0:1:0), average tempo
  photoUrl?: string;

  // the following fields are AI diagnostics
  tempos?: number[]; // tempo for each rep
  roms?: number[]; // range of motion for each rep
  velocities?: number[]; // velocity for each rep
  feedback?: string[]; // feedback for each rep
};

export class CompleteRSet {
  repsR?: number;
  timeR?: number; // in s
  distR?: number; // in m
  loadR?: number; // in kg
  romR?: number; // in cm
  velocityR?: number; // in m/s
  tempoR?: number; // e.g. 2010 (for 2:0:1:0)
  photoUrlR?: string;

  // the following fields are AI diagnostics
  temposR?: number[]; // tempo for each rep
  romsR?: number[]; // range of motion for each rep
  velocitiesR?: number[]; // velocity for each rep
  feedbackR?: string[]; // feedback for each rep
}

export type CompleteSet = Pick<WorkloadMeta, 'userId' | 'notes'> &
  Required<DateRange> &
  CompleteLSet &
  CompleteRSet & {
    eff?: number; // in %
    bpm?: number; // in bpm
    mas?: number; // max aerobic speed (%)
    recTime?: number; // in s
    recDist?: number; // in m
  };
