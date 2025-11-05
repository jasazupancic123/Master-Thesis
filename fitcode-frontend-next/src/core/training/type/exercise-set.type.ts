export type ExerciseParamField = Exclude<keyof ExerciseSet, 'setNumber'>;
export type ExerciseParamFieldExtended = ExerciseParamField | 'sets';
export type ExerciseMainParamField = Exclude<
  ExerciseParamFieldExtended,
  keyof ExerciseSetSecondarySide
>;

export type ExerciseSet = ExerciseSetPrimarySide &
  ExerciseSetSecondarySide & { setNumber: number };

export interface ExerciseSetPrimarySide {
  reps?: number; // e.g. number of repetitions
  loadKg?: number; // e.g. weight in kg or percentage of 1RM or bodyweight
  loadRm?: number; // e.g. percentage of 1RM
  loadBw?: number; // e.g. percentage of bodyweight
  tempoEcc?: number; // e.g. eccentric tempo in seconds
  tempoIso?: number; // e.g. isometric tempo in seconds
  tempoCon?: number; // e.g. concentric tempo in seconds
  tempoIdle?: number; // e.g. idle tempo in seconds
  vel?: number; // e.g. in m/s
  recTime?: number; // in seconds
  recDist?: number; // in meters, for distance-based recovery
  eff?: number; // 1 - 4
  time?: number; // in seconds, for time-based sets
  dist?: number; // in meters, for distance-based sets
}

export interface ExerciseSetSecondarySide {
  repsR?: number;
  loadKgR?: number;
  loadRmR?: number;
  loadBwR?: number;
  tempoEccR?: number;
  tempoIsoR?: number;
  tempoConR?: number;
  tempoIdleR?: number;
  velR?: number;
  recTimeR?: number;
  recDistR?: number;
  effR?: number;
  timeR?: number;
  distR?: number;
}
