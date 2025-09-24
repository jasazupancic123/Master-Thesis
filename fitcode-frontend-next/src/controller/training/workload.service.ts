import { isAfter, startOfDay } from 'date-fns';

import { TrainingService } from './training.service';
import type { Training } from './type/training.type';
import type { Workload } from './type/workload.type';

export type UserProgress = {
  userId: string;
  id: string; // componentId
  completedSets: number; // component completed sets
  totalSets: number; // component total sets
  status: WorkloadStatus;
  exercises: {
    id: string; // exerciseId
    supersetIndex: number;
    completedSets: number;
    totalSets: number;
    status: WorkloadStatus;
  }[];
  lastTimestamp: Date;
};

export enum WorkloadStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export class WorkloadService {
  static getProgress(
    training: Training,
    workloads: Workload[]
  ): UserProgress[] {
    // each workload is for one athlete (userId) and one component (componentId)
    if (!workloads || workloads.length === 0) return [];

    const userIds: string[] = Array.from(
      new Set(workloads.map((w) => w.userId))
    );

    const progress: UserProgress[] = [];
    for (const userId of userIds) {
      const prescribed = TrainingService.getTrainingByAthlete(userId, training);
      const userWorkloads = workloads
        .filter((w) => w.userId === userId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      for (const c of prescribed.components) {
        const exercises = c.supersets.flatMap((s, i) =>
          s.exercises.map((e) => ({ ...e, supersetIndex: i }))
        );

        const componentWorkloads = userWorkloads.filter(
          (w) => w.componentId === c.id
        );

        const totalComponentSets = c.supersets.reduce(
          (acc, superset) =>
            acc + superset.exercises.reduce((a, e) => a + e.sets.length, 0),
          0
        );

        const exercisesProgress = exercises.map((e) => {
          const exerciseWorkloads = componentWorkloads.filter(
            (w) => w.exerciseId === e.id
          );

          const completedExerciseSets = exerciseWorkloads.length;
          const totalExerciseSets = e.sets.length;

          return {
            id: e.id,
            supersetIndex: e.supersetIndex,
            completedSets: completedExerciseSets,
            totalSets: totalExerciseSets,
            status: this.getStatus(completedExerciseSets, totalExerciseSets),
          };
        });

        const completedComponentSets = exercisesProgress.reduce(
          (acc, e) => acc + e.completedSets,
          0
        );

        progress.push({
          userId,
          id: c.id,
          completedSets: completedComponentSets,
          totalSets: totalComponentSets,
          status: this.getStatus(completedComponentSets, totalComponentSets),
          exercises: exercises.map((e) => {
            const exerciseWorkloads = componentWorkloads.filter(
              (w) => w.exerciseId === e.id
            );

            const completedExerciseSets = exerciseWorkloads.length;
            const totalExerciseSets = e.sets.length;

            return {
              id: e.id,
              supersetIndex: e.supersetIndex,
              completedSets: completedExerciseSets,
              totalSets: totalExerciseSets,
              status: this.getStatus(completedExerciseSets, totalExerciseSets),
            };
          }),
          lastTimestamp:
            componentWorkloads[componentWorkloads.length - 1]?.createdAt ||
            startOfDay(new Date()),
        });
      }
    }

    return progress;
  }

  static getStatus(
    completedSets: number,
    totalSets: number,
    lastTimestamp?: Date
  ): WorkloadStatus {
    if (
      lastTimestamp &&
      isAfter(lastTimestamp, new Date()) &&
      completedSets < totalSets
    )
      return WorkloadStatus.OVERDUE;

    if (completedSets === 0) return WorkloadStatus.NOT_STARTED;
    if (completedSets < totalSets) return WorkloadStatus.IN_PROGRESS;
    return WorkloadStatus.COMPLETED;
  }
}
