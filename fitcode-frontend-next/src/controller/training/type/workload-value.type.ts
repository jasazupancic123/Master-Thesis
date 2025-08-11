import type { IntType, VolType } from '@/controller/component/enum/param.enum';

export type WorkloadValue = PrescribedWorkload & CompletedWorkload;

export type PrescribedWorkload = {
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
