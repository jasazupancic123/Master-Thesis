import type { RepStatus } from '../enum/rep-state';

export type RepState = {
  status: RepStatus;
  avgStartValue: number | null; // in meters
  avgExtremeValue: number | null; // in meters
};
