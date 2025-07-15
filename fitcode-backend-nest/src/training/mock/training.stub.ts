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
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';
import { AttributeValue } from 'src/attribute/entity/attribute-value.entity';
import {
  ALL_PARAM_VALUES,
  PARTIAL_PARAM_VALUES,
} from '../constant/param-values.constant';

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
  options?: {
    partialSet?: boolean;
  },
): TrainingExercise {
  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    params: data?.params || [],
    sets: data?.sets || [
      generateExerciseSet(1, options?.partialSet ? 'partial' : 'full'),
      generateExerciseSet(2, options?.partialSet ? 'partial' : 'full'),
      generateExerciseSet(3, options?.partialSet ? 'partial' : 'full'),
    ],
    attributes: data?.attributes || [],
    periodized: data?.periodized || false,
  };
}

/**
 * @param setNumber - set number, start with 1
 * @param mode - if full (by default), all possible attribute values for exercise params (see `PARAMS` constant in training constants) will be assigned, if 'partial', then only a few
 * @param paramValues - custom param values if provided, overrides any previous changes
 * @returns
 */
export function generateExerciseSet(
  setNumber: number,
  mode: 'partial' | 'full' | 'custom' = 'full',
  paramValues?: AttributeValue[],
): ExerciseSet {
  if (mode === 'custom' && !paramValues)
    throw new Error(
      'You provided "custom" mode for exercise set, you need to pass in custom paramValues',
    );

  const generatedParamValues =
    mode === 'partial' ? PARTIAL_PARAM_VALUES : ALL_PARAM_VALUES;

  return {
    setNumber,
    paramValuesL: paramValues || generatedParamValues,
    paramValuesR: paramValues || generatedParamValues,
  };
}
