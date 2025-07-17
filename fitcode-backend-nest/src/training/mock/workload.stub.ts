import type { WorkloadOptions } from '@test/common/type/workload.type';
import { generateRandomNumber } from '@test/common/utils/random.util';

import { IntType, VolType } from '@src/component/enum/param.enum';

import type { Workload } from '../entity/workload.entity';
import type {
  CompletedWorkload,
  PrescribedWorkload,
} from '../entity/workload-value.entity';
import { SetStatus } from '../enum/set-status.enum';

export function generateWorkloadStub(data?: Partial<Workload>): Workload {
  return {
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    userId: data?.userId || global.athlete.uid,
    trainingId: data?.trainingId,
    componentId: data?.componentId,
    exerciseId: data?.exerciseId,
    setNumber: data?.setNumber || 1,
    plannedAt: data?.plannedAt || new Date(),
    status: data?.status || SetStatus.NOT_STARTED,
    notes: data?.notes || null,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...data,
  };
}

export function generatePrescribedWorkloadStub(
  data?: Partial<PrescribedWorkload>,
): PrescribedWorkload {
  return {
    volWork1Type: data?.volWork1Type || VolType.Rep,
    prescribedVolWork1ValueL: data?.prescribedVolWork1ValueL || 12,
    prescribedVolWork1ValueR: data?.prescribedVolWork1ValueR || 12,
    volWork2Type: data?.volWork2Type || VolType.Time,
    prescribedVolWork2ValueL: data?.prescribedVolWork2ValueL || 60,
    prescribedVolWork2ValueR: data?.prescribedVolWork2ValueL || 60,
    volRecType: data?.volRecType || VolType.Time,
    prescribedVolRecValueL: data?.prescribedVolRecValueL || 60,
    prescribedVolRecValueR: data?.prescribedVolRecValueR || 60,
    intWork1Type: data?.intWork1Type || IntType.Kg,
    prescribedIntWork1ValueL: data?.prescribedIntWork1ValueL || 20,
    prescribedIntWork1ValueR: data?.prescribedIntWork1ValueR || 20,
    intWork2Type: data.intWork2Type || IntType.Eff,
    prescribedIntWork2ValueL: data?.prescribedIntWork2ValueL || 0,
    prescribedIntWork2ValueR: data?.prescribedIntWork2ValueR || 0,
    intRecType: data?.intRecType || IntType.Tempo,
    prescribedIntRecValueL: data?.prescribedIntRecValueL || 0,
    prescribedIntRecValueR: data?.prescribedIntRecValueR || 0,
  };
}

export function generateCompletedWorkloadStub(
  data?: Partial<CompletedWorkload>,
  options?: WorkloadOptions,
): CompletedWorkload {
  const random = options?.random || false;

  return {
    volWork1ValueL:
      data?.volWork1ValueL || random ? generateRandomNumber(0, 12) : null,
    volWork1ValueR:
      data?.volWork1ValueR || random ? generateRandomNumber(0, 12) : null,
    volWork2ValueL:
      data?.volWork2ValueL || random ? generateRandomNumber(0, 12) : null,
    volWork2ValueR:
      data?.volWork2ValueR || random ? generateRandomNumber(0, 12) : null,
    volRecValueL:
      data?.volRecValueL || random ? generateRandomNumber(0, 60) : null,
    volRecValueR:
      data?.volRecValueR || random ? generateRandomNumber(0, 60) : null,
    intWork1ValueL:
      data?.intWork1ValueL || random ? generateRandomNumber(0, 20) : null,
    intWork1ValueR:
      data?.intWork1ValueR || random ? generateRandomNumber(0, 20) : null,
    intWork2ValueL: data?.intWork2ValueL || random ? 0 : null,
    intWork2ValueR: data?.intWork2ValueR || random ? 0 : null,
    intRecValueL: data?.intRecValueL || random ? 0 : null,
    intRecValueR: data?.intRecValueR || random ? 0 : null,
  };
}

export function generateCompletedRepWorkloadsStub(
  data?: Partial<Workload>,
  sets = 3,
  reps = 12,
  intType = IntType.Kg,
  int = 60,
  repsStep = -3,
  intStep = +20,
): Workload[] {
  const workloads: Workload[] = [];
  for (let i = 0; i < sets; i++) {
    workloads.push(
      generateWorkloadStub({
        ...data,
        status: data?.status || SetStatus.COMPLETED,
        setNumber: i + 1,
        volWork1Type: VolType.Rep,
        prescribedVolWork1ValueL: reps,
        prescribedVolWork1ValueR: reps,
        volWork1ValueL: reps,
        volWork1ValueR: reps,
        intWork1Type: intType,
        prescribedIntWork1ValueL: int,
        prescribedIntWork1ValueR: int,
        intWork1ValueL: int,
        intWork1ValueR: int,
      }),
    );

    reps += repsStep;
    int += intStep;
  }

  return workloads;
}
