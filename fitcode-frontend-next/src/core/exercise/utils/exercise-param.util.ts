import type { Attribute } from '../../attribute/type/attribute.type';
import type {
  ExerciseMainParamField,
  ExerciseParamField,
} from '../../training/type/exercise-set.type';
import type { ExerciseSetParamsObj } from '../constant/exercise-param.constant';
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
} from '../constant/exercise-param.constant';

export class ExerciseParamUtil {
  readonly pairs: Record<ExerciseParamField, ExerciseParamField> = {
    reps: 'repsR',
    repsR: 'reps',
    loadKg: 'loadKgR',
    loadKgR: 'loadKg',
    loadRm: 'loadRmR',
    loadRmR: 'loadRm',
    loadBw: 'loadBwR',
    loadBwR: 'loadBw',
    tempo: 'tempoR',
    tempoR: 'tempo',
    vel: 'velR',
    velR: 'vel',
    eff: 'eff',
    time: 'time',
    dist: 'dist',
    recTime: 'recTime',
    recDist: 'recDist',
  };

  get(field: ExerciseParamField) {
    const mapper: Record<
      ExerciseParamField,
      Attribute<ExerciseSetParamsObj>
    > = {
      reps: REPS,
      repsR: { ...REPS, required: false },
      loadKg: KG,
      loadKgR: KG,
      loadBw: BW,
      loadBwR: BW,
      loadRm: RM,
      loadRmR: RM,
      tempo: TEMPO,
      tempoR: TEMPO,
      vel: VEL,
      velR: VEL,
      time: TIME,
      dist: DIST,
      eff: EFF,
      recTime: REC_TIME,
      recDist: REC_DIST,
    };

    return mapper[field];
  }

  getOptionGroup(field: ExerciseMainParamField): ExerciseMainParamField[] {
    switch (field) {
      case 'reps':
      case 'dist':
      case 'time':
        return ['reps', 'dist', 'time']; // volume group
      case 'loadKg':
      case 'loadRm':
      case 'loadBw':
      case 'vel':
        return ['loadKg', 'loadRm', 'loadBw', 'vel']; // intensity group
      case 'tempo':
      case 'eff':
        return ['tempo', 'eff']; // effort group
      case 'recTime':
      case 'recDist':
        return ['recTime', 'recDist']; // recovery group
      default:
        return [];
    }
  }
}
