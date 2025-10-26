import type { Attribute } from '../../attribute/type/attribute.type';
import type { ExerciseParamField } from '../../training/type/exercise-set.type';
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
  SETS,
  TEMPO,
  TIME,
  VEL,
} from '../constant/exercise-param.constant';

export class ExerciseParamUtil {
  readonly pairs: Record<ExerciseParamField, ExerciseParamField> = {
    sets: 'sets',
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

  get(field: ExerciseParamField | 'sets') {
    const mapper: Record<
      ExerciseParamField,
      Attribute<ExerciseSetParamsObj>
    > = {
      sets: SETS,
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
}
