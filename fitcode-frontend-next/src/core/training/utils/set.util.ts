import type {
  ExerciseMainParamField,
  ExerciseParamFieldExtended,
  ExerciseSet,
} from '../type/exercise-set.type';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import type { ExerciseSetParamsObj } from '@/core/exercise/constant/exercise-param.constant';
import {
  BW,
  DIST,
  EFF,
  KG,
  REC_DIST,
  REC_TIME,
  REPS,
  RM,
  TEMPO,
  TIME,
  VEL,
} from '@/core/exercise/constant/exercise-param.constant';
import type { Exercise } from '@/core/exercise/type/exercise.type';

type ExerciseParamNoSets = Exclude<ExerciseMainParamField, 'sets'>;

export class TrainingExerciseSetUtil {
  stub(
    setNumber: number,
    exercise: Exercise,
    data?: Partial<ExerciseSet>
  ): ExerciseSet {
    const uni = exercise.isUnilateral;

    const set: ExerciseSet = { setNumber };
    const volOptions = this.getVolOptions(exercise);
    const intOptions = this.getIntOptions(exercise);
    const effOptions = this.getEffOptions(exercise);
    const recOptions = this.getRecOptions(exercise);

    if (volOptions.length > 0) {
      const vol = volOptions.find((v) => v.field === 'reps') || volOptions[0];
      const field = vol.field as ExerciseParamNoSets;
      const value = (data?.[field] || vol.defaultValue) as number;
      set[field] = value as never;

      if (uni) {
        const pair = core.exercise.param.pairs[field] as ExerciseParamNoSets;
        if (pair) {
          const valueR = (data?.[pair] || vol.defaultValue) as number;
          set[pair] = valueR as never;
        }
      }
    }

    if (intOptions.length > 0) {
      const int = intOptions.find((i) => i.field === 'loadKg') || intOptions[0];
      const field = int.field as ExerciseParamNoSets;
      const value = (data?.[field] || int.defaultValue) as number;
      set[field] = value as never;

      if (uni) {
        const pair = core.exercise.param.pairs[field] as ExerciseParamNoSets;
        if (pair) {
          const valueR = (data?.[pair] || int.defaultValue) as number;
          set[pair] = valueR as never;
        }
      }
    }

    if (effOptions.length > 0) {
      const eff = effOptions.find((e) => e.field === 'tempo') || effOptions[0];
      const field = eff.field as ExerciseParamNoSets;
      const value = (data?.[field] || eff.defaultValue) as number | string;
      set[field] = value as never;

      if (uni) {
        const pair = core.exercise.param.pairs[field] as ExerciseParamNoSets;
        if (pair) {
          const valueR = (data?.[pair] || eff.defaultValue) as number | string;
          set[pair] = valueR as never;
        }
      }
    }

    if (recOptions.length > 0) {
      const rec =
        recOptions.find((r) => r.field === 'recTime') || recOptions[0];

      const field = rec.field as ExerciseParamNoSets;
      const value = (data?.[field] || rec.defaultValue) as number;
      set[field] = value as never;
    }

    return set;
  }

  getVolOptions(exercise: Exercise) {
    const options: Attribute<ExerciseSetParamsObj>[] = [];
    if (this.hasParam(exercise, 'time')) options.push(TIME);
    if (this.hasParam(exercise, 'dist')) options.push(DIST);
    if (this.hasParam(exercise, 'reps') || this.hasParam(exercise, 'repsR'))
      options.push(REPS);

    return options;
  }

  getIntOptions(exercise: Exercise) {
    const options: Attribute<ExerciseSetParamsObj>[] = [];
    if (this.hasParam(exercise, 'loadKg') || this.hasParam(exercise, 'loadKgR'))
      options.push(KG);

    if (this.hasParam(exercise, 'loadRm') || this.hasParam(exercise, 'loadRmR'))
      options.push(RM);

    if (this.hasParam(exercise, 'loadBw') || this.hasParam(exercise, 'loadBwR'))
      options.push(BW);

    if (this.hasParam(exercise, 'vel') || this.hasParam(exercise, 'velR'))
      options.push(VEL);

    return options;
  }

  getEffOptions(exercise: Exercise) {
    const options: Attribute<ExerciseSetParamsObj>[] = [];
    if (this.hasParam(exercise, 'eff')) options.push(EFF);
    if (this.hasParam(exercise, 'tempo') || this.hasParam(exercise, 'tempoR'))
      options.push(TEMPO);

    return options;
  }

  getRecOptions(exercise: Exercise) {
    const options: Attribute<ExerciseSetParamsObj>[] = [];
    if (this.hasParam(exercise, 'recTime')) options.push(REC_TIME);
    if (this.hasParam(exercise, 'recDist')) options.push(REC_DIST);
    return options;
  }

  getLoadType(set: ExerciseSet): 'loadKg' | 'loadRm' | 'loadBw' | undefined {
    if (set.loadRm !== undefined) return 'loadRm';
    if (set.loadBw !== undefined) return 'loadBw';
    if (set.loadKg !== undefined) return 'loadKg';
    return undefined;
  }

  getVolType(set: ExerciseSet): 'dist' | 'time' | 'reps' | undefined {
    if (set.dist !== undefined) return 'dist';
    if (set.time !== undefined) return 'time';
    if (set.reps !== undefined) return 'reps';
    return undefined;
  }

  getEffType(set: ExerciseSet): 'eff' | 'tempo' | undefined {
    if (set.eff !== undefined) return 'eff';
    if (set.tempo !== undefined) return 'tempo';
    return undefined;
  }

  getRecType(set: ExerciseSet): 'recDist' | 'recTime' | undefined {
    if (set.recDist !== undefined) return 'recDist';
    if (set.recTime !== undefined) return 'recTime';
    return undefined;
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

  private hasParam(
    exercise: Exercise,
    param: ExerciseParamFieldExtended
  ): boolean {
    return exercise.params.includes(param);
  }
}
