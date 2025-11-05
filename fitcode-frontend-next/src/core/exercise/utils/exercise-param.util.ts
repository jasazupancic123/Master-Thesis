import type { Attribute } from '../../attribute/type/attribute.type';
import type {
  ExerciseMainParamField,
  ExerciseParamField,
  ExerciseSet,
} from '../../training/type/exercise-set.type';
import {
  BW,
  DIST,
  EFF,
  KG,
  REC_DIST,
  REC_TIME,
  REPS,
  RM,
  TEMPO_CON,
  TEMPO_ECC,
  TEMPO_IDLE,
  TEMPO_ISO,
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
    tempoEcc: 'tempoEccR',
    tempoIso: 'tempoIsoR',
    tempoCon: 'tempoConR',
    tempoIdle: 'tempoIdleR',
    tempoEccR: 'tempoEcc',
    tempoIsoR: 'tempoIso',
    tempoConR: 'tempoCon',
    tempoIdleR: 'tempoIdle',
    vel: 'velR',
    velR: 'vel',
    eff: 'effR',
    effR: 'eff',
    time: 'timeR',
    timeR: 'time',
    dist: 'distR',
    distR: 'dist',
    recTime: 'recTimeR',
    recTimeR: 'recTime',
    recDist: 'recDistR',
    recDistR: 'recDist',
  };

  get(field: ExerciseParamField) {
    const mapper: Record<ExerciseParamField, Attribute<ExerciseSet>> = {
      reps: REPS,
      repsR: REPS,
      loadKg: KG,
      loadKgR: KG,
      loadBw: BW,
      loadBwR: BW,
      loadRm: RM,
      loadRmR: RM,
      tempoEcc: TEMPO_ECC,
      tempoIso: TEMPO_ISO,
      tempoCon: TEMPO_CON,
      tempoIdle: TEMPO_IDLE,
      tempoEccR: TEMPO_ECC,
      tempoIsoR: TEMPO_ISO,
      tempoConR: TEMPO_CON,
      tempoIdleR: TEMPO_IDLE,
      vel: VEL,
      velR: VEL,
      time: TIME,
      timeR: TIME,
      dist: DIST,
      distR: DIST,
      eff: EFF,
      effR: EFF,
      recTime: REC_TIME,
      recTimeR: REC_TIME,
      recDist: REC_DIST,
      recDistR: REC_DIST,
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
      case 'tempoEcc':
      case 'tempoIso':
      case 'tempoCon':
      case 'tempoIdle':
      case 'eff':
        return ['tempoEcc', 'eff']; // effort group
      case 'recTime':
      case 'recDist':
        return ['recTime', 'recDist']; // recovery group
      default:
        return [];
    }
  }
}
