export type ExerciseParamField = Exclude<keyof ExerciseSet, 'setNumber'>;
export type ExerciseParamFieldExtended = ExerciseParamField | 'sets';
export type ExerciseMainParamField = Exclude<
  ExerciseParamFieldExtended,
  keyof ExerciseSetSecondarySide
>;

export type ExerciseSet = ExerciseSetPrimarySide &
  ExerciseSetSecondarySide & {
    setNumber: number;
    recTime?: number; // in seconds
    recDist?: number; // in meters, for distance-based recovery
    eff?: number; // 1 - 4
    time?: number; // in seconds, for time-based sets
    dist?: number; // in meters, for distance-based sets
  };

export type ExerciseSetWithPrescribedTempo = ExerciseSet & {
  prescribedTempo?: string;
  prescribedTempoR?: string;
};

export interface ExerciseSetPrimarySide {
  reps?: number; // e.g. number of repetitions
  loadKg?: number; // e.g. weight in kg or percentage of 1RM or bodyweight
  loadRm?: number; // e.g. percentage of 1RM
  loadBw?: number; // e.g. percentage of bodyweight
  tempo?: string; // e.g. "2.5:0:3.5:0", meaning "eccentric:isometric:concentric:isometric" in seconds
  vel?: number; // e.g. in m/s
}

export interface ExerciseSetSecondarySide {
  repsR?: number;
  loadKgR?: number;
  loadRmR?: number;
  loadBwR?: number;
  tempoR?: string;
  velR?: number;
}
