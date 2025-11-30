import { SetStatus } from '../training/enum/set-status.enum';
import type { Superset } from '../training/type/superset.type';
import type { TrainingExercise } from '../training/type/training-exercise.type';
import type { Workload } from '../training/type/workload.type';

export class ExerciseSetService {
  static isSetCompleted(
    id: {
      trainingId: string;
      componentId: string;
      exerciseId: string;
      supersetIndex: number;
      setIndex: number;
    },
    workloads: Workload[]
  ): boolean {
    const workload = workloads.find(
      (w) =>
        w.trainingId === id.trainingId &&
        w.componentId === id.componentId &&
        w.exerciseId === id.exerciseId &&
        w.supersetIndex === id.supersetIndex &&
        w.setNumber === id.setIndex + 1
    );

    if (!workload) return false;

    return ![SetStatus.NOT_STARTED, SetStatus.IGNORED].includes(
      workload.status
    );
  }

  static findLastCompletedWorkload(
    id: {
      trainingId: string;
      componentId: string;
      exerciseId?: string;
      supersetIndex?: number;
    },
    workloads: Workload[]
  ): Workload | undefined {
    const lastCompletedWorkload = workloads
      .filter(
        (w) =>
          w.trainingId === id.trainingId &&
          w.componentId === id.componentId &&
          (id.exerciseId ? w.exerciseId === id.exerciseId : true) &&
          (id.supersetIndex ? w.supersetIndex === id.supersetIndex : true)
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

    return lastCompletedWorkload;
  }

  static getCompletedExerciseSetsCount(
    id: {
      trainingId: string;
      componentId: string;
      exerciseId: string;
      supersetIndex: number;
    },
    workloads: Workload[]
  ): number {
    return workloads.filter(
      (w) =>
        w.trainingId === id.trainingId &&
        w.componentId === id.componentId &&
        w.exerciseId === id.exerciseId &&
        w.supersetIndex === id.supersetIndex &&
        ![SetStatus.NOT_STARTED, SetStatus.IGNORED].includes(w.status)
    ).length;
  }

  static hasExerciseGotUndoneSets(
    exercise: TrainingExercise,
    id: {
      trainingId: string;
      componentId: string;
      supersetIndex: number;
    },
    workloads: Workload[]
  ): boolean {
    return exercise.sets.some((set) => {
      const workload = workloads.find(
        (w) =>
          w.trainingId === id.trainingId &&
          w.componentId === id.componentId &&
          w.exerciseId === exercise.id &&
          w.supersetIndex === id.supersetIndex &&
          w.setNumber === set.setNumber
      );

      if (!workload) return true;

      return [SetStatus.NOT_STARTED, SetStatus.IGNORED].includes(
        workload.status
      );
    });
  }

  static getUndoneExercisesFromSuperset(
    superset: Superset,
    id: {
      trainingId: string;
      componentId: string;
      supersetIndex: number;
    },
    workloads: Workload[]
  ) {
    const exercises = superset.exercises.flat();

    const { supersetIndex, componentId, trainingId } = id;

    return exercises.filter((exercise) => {
      return this.hasExerciseGotUndoneSets(
        exercise,
        { trainingId, componentId, supersetIndex },
        workloads
      );
    });
  }
}
