import {
  PartialRecordedWorkloadValues,
  Workload,
} from '@/core/training/type/workload.type';
import { getSupersetIndex } from './actions-superset-index';
import { core } from '@/core/core.service';
import { Training } from '@/core/training/type/training.type';

export function createEmptyPartialWorkload(state: {
  individualTraining: Training;
  workloads: Workload[];
  userId: string;
  componentId: string;
  exerciseId: string;
  setIndex: number;
  workloadInput?: PartialRecordedWorkloadValues;
}): Workload | null {
  const {
    individualTraining,
    workloads,
    userId,
    componentId,
    exerciseId,
    setIndex,
    workloadInput,
  } = state;

  let workload: Workload | undefined | null = workloads.find(
    (w) =>
      w.userId === userId &&
      w.exerciseId === exerciseId &&
      w.setNumber === setIndex + 1 &&
      w.componentId === componentId &&
      w.trainingId === individualTraining?.id &&
      w.supersetIndex ===
        getSupersetIndex(individualTraining, componentId, exerciseId)
  );

  if (!workload) {
    const supersetIndex = getSupersetIndex(
      individualTraining,
      componentId,
      exerciseId
    );

    if (supersetIndex === null) return null;

    console.log('generating empty workload for set');
    workload = core.training.workload.createEmptyWorkloadFromTraining(
      {
        trainingId: individualTraining.id,
        componentId: componentId,
        exerciseId: exerciseId,
        supersetIndex,
        setNumber: (setIndex || 0) + 1,
        userId: userId,
      },
      individualTraining,
      workloadInput
    );
  }

  return workload;
}
