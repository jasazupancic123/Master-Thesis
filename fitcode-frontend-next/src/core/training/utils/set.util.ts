import type {
  ExerciseMainParamField,
  ExerciseParamFieldExtended,
  ExerciseSet,
} from '../type/exercise-set.type';
import type { Attribute } from '@/core/attribute/type/attribute.type';
import { core } from '@/core/core.service';
import {
  BW,
  DIST,
  EFF,
  KG,
  REC_DIST,
  REC_TIME,
  REPS,
  RM,
  TEMPO_ECC,
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
    const set: ExerciseSet = { setNumber };
    const volOptions = this.getVolOptions(exercise);
    const intOptions = this.getIntOptions(exercise);
    const effOptions = this.getEffOptions(exercise);
    const recOptions = this.getRecOptions(exercise);

    this.assignParamOption(set, exercise, volOptions, 'reps', data);
    this.assignParamOption(set, exercise, intOptions, 'loadKg', data);
    this.assignParamOption(set, exercise, effOptions, 'tempoEcc', data);
    this.assignParamOption(set, exercise, recOptions, 'recTime', data);
    return set;
  }

  getVolOptions(exercise: Exercise) {
    const options: Attribute<ExerciseSet>[] = [];
    if (this.hasParam(exercise, 'time')) options.push(TIME);
    if (this.hasParam(exercise, 'dist')) options.push(DIST);
    if (this.hasParam(exercise, 'reps') || this.hasParam(exercise, 'repsR'))
      options.push(REPS);

    return options;
  }

  getIntOptions(exercise: Exercise) {
    const options: Attribute<ExerciseSet>[] = [];
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
    const options: Attribute<ExerciseSet>[] = [];
    if (this.hasParam(exercise, 'eff')) options.push(EFF);
    if (
      this.hasParam(exercise, 'tempoEcc') ||
      this.hasParam(exercise, 'tempoEccR')
    )
      options.push(TEMPO_ECC);

    return options;
  }

  getRecOptions(exercise: Exercise) {
    const options: Attribute<ExerciseSet>[] = [];
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

  getEffType(set: ExerciseSet): 'eff' | 'tempoEcc' | undefined {
    if (set.eff !== undefined) return 'eff';
    if (set.tempoEcc !== undefined) return 'tempoEcc';
    return undefined;
  }

  getRecType(set: ExerciseSet): 'recDist' | 'recTime' | undefined {
    if (set.recDist !== undefined) return 'recDist';
    if (set.recTime !== undefined) return 'recTime';
    return undefined;
  }

  getTempo(
    set: ExerciseSet,
    removeIdle?: boolean
  ): [number, number, number, number] | [number, number, number] {
    if (removeIdle)
      return [set.tempoEcc || 2, set.tempoIso || 0, set.tempoCon || 1];

    return [
      set.tempoEcc || 2,
      set.tempoIso || 0,
      set.tempoCon || 1,
      set.tempoIdle || 0,
    ];
  }

  getTempoR(
    set: ExerciseSet,
    removeIdle?: boolean
  ): [number, number, number, number] | [number, number, number] {
    if (removeIdle)
      return [set.tempoEccR || 2, set.tempoIsoR || 0, set.tempoConR || 1];

    return [
      set.tempoEccR || 2,
      set.tempoIsoR || 0,
      set.tempoConR || 1,
      set.tempoIdleR || 0,
    ];
  }

  setTempo(set: ExerciseSet, tempo: [number, number, number, number]) {
    set.tempoEcc = tempo[0];
    set.tempoIso = tempo[1];
    set.tempoCon = tempo[2];
    set.tempoIdle = tempo[3];
  }

  setTempoR(set: ExerciseSet, tempo: [number, number, number, number]) {
    set.tempoEccR = tempo[0];
    set.tempoIsoR = tempo[1];
    set.tempoConR = tempo[2];
    set.tempoIdleR = tempo[3];
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
      a.tempoEcc === b.tempoEcc &&
      a.tempoIso === b.tempoIso &&
      a.tempoCon === b.tempoCon &&
      a.tempoIdle === b.tempoIdle &&
      a.tempoEccR === b.tempoEccR &&
      a.tempoIsoR === b.tempoIsoR &&
      a.tempoConR === b.tempoConR &&
      a.tempoIdleR === b.tempoIdleR &&
      a.vel === b.vel &&
      a.velR === b.velR &&
      a.recTime === b.recTime &&
      a.recTimeR === b.recTimeR &&
      a.recDist === b.recDist &&
      a.recDistR === b.recDistR &&
      a.eff === b.eff &&
      a.effR === b.effR &&
      a.time === b.time &&
      a.timeR === b.timeR &&
      a.dist === b.dist &&
      a.distR === b.distR
    );
  }

  private hasParam(
    exercise: Exercise,
    param: ExerciseParamFieldExtended
  ): boolean {
    return exercise.params.includes(param);
  }

  private assignParamOption<T extends keyof ExerciseSet>(
    set: ExerciseSet,
    exercise: Exercise,
    options: Attribute<ExerciseSet>[],
    preferredField: T,
    data?: Partial<ExerciseSet>
  ) {
    if (options.length === 0) return;

    const option =
      options.find((o) => o.field === preferredField) || options[0];
    const field = option.field as ExerciseParamNoSets;
    const value = (data?.[field] ?? option.defaultValue) as ExerciseSet[T];
    set[field] = value as never;

    if (exercise.isUnilateral) {
      const pair = core.exercise.param.pairs[field] as ExerciseParamNoSets;
      if (pair) {
        const valueR = (data?.[pair] ?? option.defaultValue) as ExerciseSet[T];
        set[pair] = valueR as never;
      }
    }
  }
}
