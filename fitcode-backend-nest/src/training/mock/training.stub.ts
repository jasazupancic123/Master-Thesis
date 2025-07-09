import { v4 } from 'uuid';
import { Training } from '../entity/training.entity';
import { addDays, addHours } from 'date-fns';
import { TrainingComponent } from '../entity/training-component.entity';
import {
  generateRandomColor,
  generateRandomName,
} from '../../../test/common/utils/random.util';
import { Superset } from '../entity/superset.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Subgroup } from '../entity/subgroup.entity';
import { getTime } from '../../common/service/util/date.util';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { ParamType } from '../../component/enum/param.enum';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';

export function generateTrainingStub(data?: Partial<Training>): Training {
  return {
    id: data?.id || v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    completedMembersIds: data?.completedMembersIds || [],
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    ownerId: data?.ownerId || global.trainer.uid,
    membersIds: data?.membersIds || [global.athlete.uid],
    stats: data?.stats || [],
    futureStats: data?.futureStats || [],
    copiedFromId: data?.copiedFromId || null,
    from: data?.from || addDays(new Date(), 1),
    to: data?.to || addHours(addDays(new Date(), 1), 2),
    warmup:
      data?.warmup || generateTrainingComponent({ id: WARMUP_COMPONENT_ID }),
    cooldown:
      data?.cooldown ||
      generateTrainingComponent({ id: COOLDOWN_COMPONENT_ID }),
    components: data?.components || [],
    wellness: data?.wellness || [],
  };
}

export function generateTrainingComponent(
  data?: Partial<TrainingComponent>,
): TrainingComponent {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    from: data?.from || getTime(addDays(new Date(), 2), 8, 0),
    to: data?.to || getTime(addDays(new Date(), 2), 8, 30),
    target: data?.target || null,
    periodizationType: data?.periodizationType || null,
    methodId: data?.methodId || null,
    completedMembersIds: data?.completedMembersIds || [],
    supersets: data?.supersets || [],
    subgroups: data?.subgroups || [],
  };
}

export function generateSuperset(data?: Partial<Superset>): Superset {
  return {
    color: data?.color || generateRandomColor(),
    exercises: data?.exercises || [],
  };
}

export function generateSubgroup(data?: Partial<Subgroup>): Subgroup {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    name: data?.name || generateRandomName(),
    periodizationType: data?.periodizationType || null,
    membersIds: data?.membersIds || [],
    supersets: data?.supersets || [],
    futureStats: data?.futureStats || [],
  };
}

export function generateTrainingExercise(
  data?: Partial<TrainingExercise>,
): TrainingExercise {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    params: data?.params || [],
    sets: data?.sets || [],
    attributes: data?.attributes || [],
    periodized: data?.periodized || false,
  };
}

export function generateExerciseSet(data?: Partial<ExerciseSet>): ExerciseSet {
  return {
    setNumber: data?.setNumber || 1,
    paramValuesL: data?.paramValuesL || [
      {
        field: ParamType.VolWork1,
        selected: 'rep',
        value: '12',
      },
      {
        field: ParamType.IntWork1,
        selected: 'kg',
        value: '20',
      },
      {
        field: ParamType.IntWork2,
        selected: 'eff',
        value: '0',
      },
      {
        field: ParamType.VolRec1,
        selected: 'time',
        value: '60',
      },
    ],
    paramValuesR: data?.paramValuesR || [
      {
        field: ParamType.VolWork1,
        selected: 'rep',
        value: '12',
      },
      {
        field: ParamType.IntWork1,
        selected: 'kg',
        value: '20',
      },
      {
        field: ParamType.IntWork2,
        selected: 'eff',
        value: '0',
      },
      {
        field: ParamType.VolRec1,
        selected: 'time',
        value: '60',
      },
    ],
  };
}
