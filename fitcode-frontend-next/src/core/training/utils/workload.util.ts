import { isAfter, startOfDay } from 'date-fns';

import type { Training } from '../type/training.type';
import type { UserProgress } from '../type/workload.type';
import { type Workload, WorkloadStatus } from '../type/workload.type';
import { app } from '@/core/app.service';

export class WorkloadUtil {
  getStatus(
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

  getProgress(training: Training, workloads: Workload[]): UserProgress[] {
    // each workload is for one athlete (userId) and one component (componentId)
    if (!workloads || workloads.length === 0) return [];

    const userIds: string[] = Array.from(
      new Set(workloads.map((w) => w.userId))
    );

    const progress: UserProgress[] = [];
    for (const userId of userIds) {
      const prescribed = app.training.getAthleteTraining(userId, training);

      const userWorkloads = workloads
        .filter((w) => w.userId === userId)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
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
            componentWorkloads[componentWorkloads.length - 1]?.timestamp ||
            startOfDay(new Date()),
        });
      }
    }

    return progress;
  }
}
