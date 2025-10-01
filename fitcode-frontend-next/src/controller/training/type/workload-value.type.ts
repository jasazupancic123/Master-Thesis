import type { IntType, VolType } from '@/controller/component/enum/param.enum';

export type WorkloadValue = PrescribedWorkload & CompletedWorkload;

export type PrescribedWorkload = {
  pRecTime: number; // in seconds
  rRecDist?: number; // in meters, for distance-based recovery

  /* --------------- Primary Side --------------- */
  pReps: number; // prefix "p" is for "prescribed"
  pLoad?: number; // always in kg
  pTempo?: string; // e.g. "2.5:0:3.5:0", meaning "eccentric:isometric:concentric:isometric" in seconds
  pTime?: number; // for isometric holds, in seconds
  pDist?: number; // for distance-based sets, in meters

  /* --------------- Secondary Side (if applicable) --------------- */
  pRepsR?: number;
  pLoadR?: number;
  pTempoR?: string;
  pTimeR?: number;
  pDistR?: number;

  /* --------------- Deprecated --------------- */
  volWork1Type?: VolType;
  prescribedVolWork1ValueL?: number | undefined;
  prescribedVolWork1ValueR?: number | undefined;

  volWork2Type?: VolType;
  prescribedVolWork2ValueL?: number | undefined;
  prescribedVolWork2ValueR?: number | undefined;

  volRecType?: VolType;
  prescribedVolRecValueL?: number | undefined;
  prescribedVolRecValueR?: number | undefined;

  intWork1Type?: IntType;
  prescribedIntWork1ValueL?: number | undefined;
  prescribedIntWork1ValueR?: number | undefined;

  intWork2Type?: IntType;
  prescribedIntWork2ValueL?: number | undefined;
  prescribedIntWork2ValueR?: number | undefined;

  intRecType?: IntType;
  prescribedIntRecValueL?: number | undefined;
  prescribedIntRecValueR?: number | undefined;
};

export type CompletedWorkload = {
  recTime: number;
  recDist?: number;

  /* --------------- Primary Side --------------- */
  reps: number;
  load?: number;
  tempo?: string;
  time?: number;
  dist?: number;

  /* --------------- Secondary Side (if applicable) --------------- */
  repsR?: number;
  loadR?: number;
  tempoR?: string;
  timeR?: number;
  distR?: number;

  /* --------------- Deprecated --------------- */
  volWork1ValueL?: number;
  volWork1ValueR?: number;
  volWork2ValueL?: number;
  volWork2ValueR?: number;
  volRecValueL?: number;
  volRecValueR?: number;
  intWork1ValueL?: number;
  intWork1ValueR?: number;
  intWork2ValueL?: number;
  intWork2ValueR?: number;
  intRecValueL?: number;
  intRecValueR?: number;
};
