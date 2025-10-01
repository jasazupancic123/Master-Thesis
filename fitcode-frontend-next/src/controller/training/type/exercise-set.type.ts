import type { LoadType } from '../enum/load-type.enum';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';

export type ExerciseSet = ExerciseSetPrimarySide &
  ExerciseSetSecondarySide & {
    setNumber: number;
    recTime: number; // in seconds
    recDist?: number; // in meters, for distance-based recovery
    loadType?: LoadType;

    /* ---------------------- Deprecated ---------------------- */
    paramValuesL: AttributeValue[];
    paramValuesR?: AttributeValue[];
  };

export interface ExerciseSetPrimarySide {
  reps: number;
  load?: number; // e.g. weight in kg or percentage of 1RM or bodyweight
  tempo?: string; // e.g. "2.5:0:3.5:0", meaning "eccentric:isometric:concentric:isometric" in seconds
  time?: number; // for isometric holds, in seconds
  dist?: number; // for distance-based sets, in meters
}

export interface ExerciseSetSecondarySide {
  repsR?: number;
  loadR?: number;
  tempoR?: string;
  timeR?: number;
  distR?: number;
}
