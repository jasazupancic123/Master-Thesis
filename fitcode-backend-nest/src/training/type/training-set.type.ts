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
