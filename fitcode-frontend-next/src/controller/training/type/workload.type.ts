import { TimestampEntity } from '@/common/type/entity.type';
import { SetStatus } from '../enum/set-status.enum';
import { IntType, VolType } from '@/controller/component/enum/param.enum';

export type Workload = TimestampEntity &
  WorkloadValue & {
    institutionId?: string;
    groupId?: string;
    cycleId?: string;
    userId: string;
    trainingId: string;
    componentId: string;
    exerciseId: string;
    setNumber: number;
    status: SetStatus;
    plannedAt: Date;
    notes?: string;
    isPersonalized: boolean;
  };

export type WorkloadValue = {
  volWork1Type?: VolType;
  prescribedVolWork1ValueL?: number;
  prescribedVolWork1ValueR?: number;
  volWork1Value?: number;
  volWork1ValueL?: number;
  volWork1ValueR?: number;
  volWork2Type?: VolType;
  prescribedVolWork2ValueL?: number;
  prescribedVolWork2ValueR?: number;
  volWork2Value?: number;
  volWork2ValueL?: number;
  volWork2ValueR?: number;
  volRecType?: VolType;
  prescribedVolRecValueL?: number;
  prescribedVolRecValueR?: number;
  volRecValue?: number;
  volRecValueL?: number;
  volRecValueR?: number;
  intWork1Type?: IntType;
  prescribedIntWork1ValueL?: number;
  prescribedIntWork1ValueR?: number;
  intWork1Value?: number;
  intWork1ValueL?: number;
  intWork1ValueR?: number;
  intWork2Type?: IntType;
  prescribedIntWork2ValueL?: number;
  prescribedIntWork2ValueR?: number;
  intWork2Value?: number;
  intWork2ValueL?: number;
  intWork2ValueR?: number;
  intRecType?: IntType;
  prescribedIntRecValueL?: number;
  prescribedIntRecValueR?: number;
  intRecValue?: number;
  intRecValueL?: number;
  intRecValueR?: number;
};
