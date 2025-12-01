import { isAfter, startOfDay } from 'date-fns';

import type { Training } from '../type/training.type';
import type {
  CreateWorkload,
  PartialWorkload,
  UserProgress,
} from '../type/workload.type';
import { type Workload, WorkloadStatus } from '../type/workload.type';
import { core } from '@/core/core.service';

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
      const prescribed = core.training.getAthleteTraining(userId, training);

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

  /**
   * Returns the active time in seconds for the given workload, calculated via prescribed tempo and completed reps
   */
  getActiveWorkloadTimeS(workload: Omit<CreateWorkload, 'userId'>): number {
    const leftRepDuraitonS =
      (workload.tempoCon || 0) +
      (workload.tempoEcc || 0) +
      (workload.tempoIdle || 0) +
      (workload.tempoIso || 0);

    const rightRepDurationS =
      (workload.tempoConR || 0) +
      (workload.tempoEccR || 0) +
      (workload.tempoIdleR || 0) +
      (workload.tempoIsoR || 0);

    const leftSideDurationS = (workload.reps || 0) * leftRepDuraitonS;
    const rightSideDurationS = (workload.repsR || 0) * rightRepDurationS;

    return leftSideDurationS + rightSideDurationS;
  }

  /**
   * Generates an empty workload object for the given training and identifiers
   */
  createEmptyWorkloadFromTraining(
    id: {
      trainingId: string;
      componentId: string;
      exerciseId: string;
      supersetIndex: number;
      setNumber: number;
      userId: string;
    },
    training: Training
  ): Workload | null {
    const {
      trainingId,
      componentId,
      exerciseId,
      supersetIndex,
      setNumber,
      userId,
    } = id;

    const component = training.components.find((c) => c.id === componentId);
    if (!component) return null;

    const superset = component.supersets[supersetIndex];
    if (!superset) return null;

    const exercise = superset.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return null;

    const set = exercise.sets[setNumber];
    if (!set) return null;

    const workload: PartialWorkload = {
      userId: userId,
      trainingId: trainingId,
      componentId: componentId,
      supersetIndex: supersetIndex,
      exerciseId: exerciseId,
      setNumber: setNumber,
      timestamp: new Date(),
      notes: '',
      reps: set.reps,
      repsR: set.repsR,
      time: set.time,
      timeR: set.timeR,
      dist: set.dist,
      distR: set.distR,
      loadKg: set.loadKg,
      loadKgR: set.loadKgR,
      vel: set.vel,
      velR: set.velR,
      tempoEcc: set.tempoEcc,
      tempoIso: set.tempoIso,
      tempoCon: set.tempoCon,
      tempoIdle: set.tempoIdle,
      tempoEccR: set.tempoEccR,
      tempoIsoR: set.tempoIsoR,
      tempoConR: set.tempoConR,
      tempoIdleR: set.tempoIdleR,
      eff: set.eff,
      effR: set.effR,
      recTime: set.recTime,
      recTimeR: set.recTimeR,
      recDist: set.recDist,
      recDistR: set.recDistR,
      photoURLs: [],
      rir: undefined,
      rirR: undefined,
      rom: undefined,
      romR: undefined,
      from: new Date(),
      to: new Date(),
    };

    return workload as Workload;
  }
}
