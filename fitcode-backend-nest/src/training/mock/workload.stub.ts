import { v4 } from 'uuid';

import type { Create } from '@src/common/type/entity.type';

import type { ExerciseSet } from '../entity/exercise-set.entity';
import type {
  Workload,
  WorkloadMeta,
  WorkloadValue,
} from '../entity/workload.entity';
import { SetStatus } from '../enum/set-status.enum';

export function generateWorkloadStub(
  data: Create<Omit<WorkloadMeta, 'id'>> &
    Omit<WorkloadValue, 'reps' | 'recTime' | 'timestamp' | 'photoURLs'> & {
      prescribed: Partial<ExerciseSet>;
      reps?: number;
      recTime?: number;
      timestamp?: Date;
      photoURLs?: string[];
      random?: boolean;
    },
): Workload {
  const setNumber = data?.setNumber || 1;

  const workloadMeta = generateWorkloadMetaStub(data);
  const workloadValue: WorkloadValue = {
    timestamp: data?.timestamp || new Date(),
    photoURLs: data?.photoURLs || [],
    reps: data?.reps || 10,
    repsR: data?.repsR,
    loadKg: data?.loadKg,
    loadKgR: data?.loadKgR,
    loadRm: data?.loadRm,
    loadRmR: data?.loadRmR,
    loadBw: data?.loadBw,
    loadBwR: data?.loadBwR,
    tempoEcc: data?.tempoEcc,
    tempoEccR: data?.tempoEccR,
    tempoIso: data?.tempoIso,
    tempoIsoR: data?.tempoIsoR,
    tempoCon: data?.tempoCon,
    tempoConR: data?.tempoConR,
    tempoIdle: data?.tempoIdle,
    tempoIdleR: data?.tempoIdleR,
    vel: data?.vel,
    velR: data?.velR,
    rom: data?.rom,
    romR: data?.romR,
    eff: data?.eff,
    effR: data?.effR,
    time: data?.time,
    timeR: data?.timeR,
    dist: data?.dist,
    distR: data?.distR,
    recTime: data?.recTime || 60,
    recTimeR: data?.recTimeR,
    recDist: data?.recDist,
    recDistR: data?.recDistR,
    rir: data?.rir,
    rirR: data?.rirR,
  };

  return {
    ...workloadMeta,
    ...workloadValue,
    prescribed: { setNumber, reps: 10, recTime: 60, ...data.prescribed },
  };
}

export function generateWorkloadMetaStub(
  data?: Partial<WorkloadMeta>,
): WorkloadMeta {
  return {
    id: data?.id || v4(),
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    userId: data?.userId,
    trainingId: data?.trainingId,
    componentId: data?.componentId,
    supersetIndex: data?.supersetIndex,
    exerciseId: data?.exerciseId,
    setNumber: data?.setNumber,
    status: data?.status || SetStatus.NOT_STARTED,
    notes: data?.notes || null,
  };
}
