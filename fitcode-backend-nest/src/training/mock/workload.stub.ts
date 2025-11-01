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
    recTime: data?.recTime || 60,
    loadKg: data?.loadKg,
    loadRm: data?.loadRm,
    loadBw: data?.loadBw,
    tempo: data?.tempo,
    vel: data?.vel,
    rom: data?.rom,
    tempos: data?.tempos,
    roms: data?.roms,
    velocities: data?.velocities,
    feedback: data?.feedback,
    repsR: data?.repsR,
    loadKgR: data?.loadKgR,
    loadRmR: data?.loadRmR,
    loadBwR: data?.loadBwR,
    tempoR: data?.tempoR,
    velR: data?.velR,
    romR: data?.romR,
    temposR: data?.temposR,
    romsR: data?.romsR,
    velocitiesR: data?.velocitiesR,
    feedbackR: data?.feedbackR,
    eff: data?.eff,
    time: data?.time,
    dist: data?.dist,
    recDist: data?.recDist,
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
    exerciseId: data?.exerciseId,
    setNumber: data?.setNumber,
    supersetIndex: data?.supersetIndex,
    status: data?.status || SetStatus.NOT_STARTED,
    notes: data?.notes || null,
  };
}
