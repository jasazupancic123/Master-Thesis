import type { LoadType } from '../enum/load-type.enum';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

export type ExerciseSet = ExerciseSetPrimarySide &
  ExerciseSetSecondarySide & {
    setNumber: number;
    recTime: number; // in seconds
    recDist?: number; // in meters, for distance-based recovery
    loadType?: LoadType;
    eff?: number; // 1 - 4
    time?: number; // in seconds, for time-based sets
    dist?: number; // in meters, for distance-based sets

    /* ---------------------- Deprecated ---------------------- */
    paramValuesL: AttributeValue[];
    paramValuesR?: AttributeValue[];
  };

export interface ExerciseSetPrimarySide {
  reps: number;
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
