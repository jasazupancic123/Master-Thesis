import { IntType, VolType } from '../../component/enum/param.enum';
import { Workload } from '../entity/workload.entity';
import { SetStatus } from '../enum/set-status.enum';

export function generateWorkloadStub(data?: Partial<Workload>): Workload {
  return {
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
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
        volWork1ValueL: reps,
        intWork1Type: intType,
        prescribedIntWork1ValueL: int,
        intWork1ValueL: int,
      }),
    );

    reps += repsStep;
    int += intStep;
  }

  return workloads;
}
