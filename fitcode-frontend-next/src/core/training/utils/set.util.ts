import type { ExerciseSet } from '../type/exercise-set.type';
import {
  KG,
  REPS,
  TEMPO,
} from '@/core/exercise/constant/exercise-param.constant';
import type { Exercise } from '@/core/exercise/type/exercise.type';

export class TrainingExerciseSetUtil {
  stub(
    setNumber: number,
    exercise: Exercise,
    data?: Partial<ExerciseSet>
  ): ExerciseSet {
    const uni = exercise.isUnilateral;

    return {
      setNumber,
      reps: data?.reps || (REPS.defaultValue as number),
      ...(uni ? { repsR: data?.repsR || (REPS.defaultValue as number) } : {}),
      loadKg: data?.loadKg || (KG.defaultValue as number),
      ...(uni ? { loadKgR: data?.loadKgR || (KG.defaultValue as number) } : {}),
      tempo: data?.tempo || (TEMPO.defaultValue as string),
      ...(uni
        ? { tempoR: data?.tempoR || (TEMPO.defaultValue as string) }
        : {}),
      recTime: data?.recTime || 60,
    };
  }

  getLoadType(set: ExerciseSet) {
    if (set.loadRm !== undefined) return 'loadRm';
    if (set.loadBw !== undefined) return 'loadBw';
    return 'loadKg';
  }

  getVolType(set: ExerciseSet) {
    if (set.dist !== undefined) return 'dist';
    if (set.time !== undefined) return 'time';
    return 'reps';
  }

  getEffType(set: ExerciseSet) {
    if (set.eff !== undefined) return 'eff';
    return 'tempo';
  }

  getRecType(set: ExerciseSet) {
    if (set.recDist !== undefined) return 'recDist';
    return 'recTime';
  }

  isEqual(a: ExerciseSet, b: ExerciseSet): boolean {
    return (
      a.setNumber === b.setNumber &&
      a.reps === b.reps &&
      a.repsR === b.repsR &&
      a.loadKg === b.loadKg &&
      a.loadKgR === b.loadKgR &&
      a.loadRm === b.loadRm &&
      a.loadRmR === b.loadRmR &&
      a.loadBw === b.loadBw &&
      a.loadBwR === b.loadBwR &&
      a.tempo === b.tempo &&
      a.tempoR === b.tempoR &&
      a.vel === b.vel &&
      a.velR === b.velR &&
      a.recTime === b.recTime &&
      a.recDist === b.recDist &&
      a.eff === b.eff &&
      a.time === b.time &&
      a.dist === b.dist
    );
  }
}
