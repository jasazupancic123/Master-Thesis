import { v4 } from 'uuid';

import type { Component } from '@src/component/entity/component.entity';

import type { ExerciseSet } from '../entity/exercise-set.entity';
import type { Workload, WorkloadMeta } from '../entity/workload.entity';
import { SetStatus } from '../enum/set-status.enum';
import { generateExerciseSet } from './training.stub';

export function generateWorkloadStub(
  component: Component,
  data?: Partial<Omit<Workload, 'componentId'>> & {
    randomValues?: boolean;
    params?: (keyof ExerciseSet)[];
  },
): Workload {
  const random = data?.randomValues || false;
  const params = (data?.params ||
    component.params ||
    []) as (keyof ExerciseSet)[];

  const meta = generateWorkloadMetaStub({ ...data, componentId: component.id });
  const prescribed = generateExerciseSet(data?.setNumber || 1, params, {
    random,
  });

  const completed = generateExerciseSet(data?.setNumber || 1, params, {
    random,
  });

  return {
    ...meta,
    ...completed,
    prescribed,
    from: new Date(),
    to: new Date(),
    photoURLs: data?.photoURLs || [],
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
