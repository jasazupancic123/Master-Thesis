import { VolType, IntType } from '@/controller/component/enum/param.enum';

export type WorkloadValue = PrescribedWorkload & CompletedWorkload;

export type PrescribedWorkload = {
  volWork1Type?: VolType;
  prescribedVolWork1ValueL?: number;
  prescribedVolWork1ValueR?: number;

  volWork2Type?: VolType;
  prescribedVolWork2ValueL?: number;
  prescribedVolWork2ValueR?: number;

  volRecType?: VolType;
  prescribedVolRecValueL?: number;
  prescribedVolRecValueR?: number;

  intWork1Type?: IntType;
  prescribedIntWork1ValueL?: number;
  prescribedIntWork1ValueR?: number;

  intWork2Type?: IntType;
  prescribedIntWork2ValueL?: number;
  prescribedIntWork2ValueR?: number;

  intRecType?: IntType;
  prescribedIntRecValueL?: number;
  prescribedIntRecValueR?: number;
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
