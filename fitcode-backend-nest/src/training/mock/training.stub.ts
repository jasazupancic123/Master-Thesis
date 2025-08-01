import { addDays, addHours } from 'date-fns';
import { v4 } from 'uuid';

import type { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { getTime } from '@src/common/service/util/date.util';
import {
  generateRandomColor,
  generateRandomName,
} from '@src/common/utils/random.util';
import { PARAMS } from '@src/component/constant/param.constant';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import type { ComponentParam } from '@src/component/entity/component-param.entity';

import type { ExerciseSet } from '../entity/exercise-set.entity';
import type { Subgroup } from '../entity/subgroup.entity';
import type { Superset } from '../entity/superset.entity';
import type { Training } from '../entity/training.entity';
import type { TrainingComponent } from '../entity/training-component.entity';
import type { TrainingExercise } from '../entity/training-exercise.entity';
import { generateParamAttributeValuesFromComponentParams } from './param-values.stub';

/**
 * Generates a training stub with default values or overrides from the provided data.
 * Note that in training service, `from` and `to` dates are calculated based on the
 * provided `components` dates (training's `from` and `to` cannot be set directly).
 * Here, we set `from` and `to` dates directly for simplicity and evenly space
 * the components in between them.
 */
export function generateTrainingStub(
  data?: Partial<Training> & { date?: Date },
): Training {
  // evenly space components in between training's from and to dates
  const from = data?.from || data?.date || new Date();
  const to = data?.to || addHours(from, 2);

  const components: TrainingComponent[] = data?.components || [];
  if (components.length) {
    const duration = (to.getTime() - from.getTime()) / components.length;

    components.forEach((c, i) => {
      c.from = new Date(from.getTime() + i * duration);
      c.to = new Date(c.from.getTime() + duration);
    });
  }

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
    copiedFromId: data?.copiedFromId || null,
    from,
    to,
    warmup:
      data?.warmup || generateTrainingComponent({ id: WARMUP_COMPONENT_ID }),
    cooldown:
      data?.cooldown ||
      generateTrainingComponent({ id: COOLDOWN_COMPONENT_ID }),
    components,
  };
}

export function generateTrainingComponent(
  data?: Partial<TrainingComponent>,
): TrainingComponent {
  const from = data?.from || getTime(addDays(new Date(), 2), 8, 0);

  return {
    id: data?.id ?? v4(),
    color: data?.color || generateRandomColor(),
    from: data?.from || getTime(addDays(new Date(), 2), 8, 0),
    to: addHours(from, 1),
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
  };
}

/**
 * Generates an ExerciseSet object. If paramValuesOrComponentParams is not provided,
 * it generates random parameter values for the set, else it uses the provided values
 * by generating them from component parameters or using the provided AttributeValue
 * array as is.

 * @param setNumber - the number of the set
 * @param paramValues - array of AttributeValue objects for the set or componentParams
 * - array of ComponentParam objects to generate AttributeValues from
 * @param random - if true, generates random values for the set
 */
export function generateExerciseSet(
  setNumber: number,
  random?: boolean,
): ExerciseSet;
export function generateExerciseSet(
  setNumber: number,
  paramValues: AttributeValue[],
  random?: boolean,
): ExerciseSet;
export function generateExerciseSet(
  setNumber: number,
  componentParams: ComponentParam[],
  random?: boolean,
): ExerciseSet;
export function generateExerciseSet(
  setNumber: number,
  paramValuesOrComponentParamsOrRandom?:
    | AttributeValue[]
    | ComponentParam[]
    | boolean,
  random?: boolean,
): ExerciseSet {
  const isRandom =
    typeof paramValuesOrComponentParamsOrRandom === 'boolean'
      ? paramValuesOrComponentParamsOrRandom
      : random
        ? random
        : false;

  const paramValues = !paramValuesOrComponentParamsOrRandom
    ? generateParamAttributeValuesFromComponentParams(PARAMS, isRandom)
    : typeof paramValuesOrComponentParamsOrRandom !== 'boolean' &&
        isAttributeValueArray(paramValuesOrComponentParamsOrRandom)
      ? paramValuesOrComponentParamsOrRandom
      : typeof paramValuesOrComponentParamsOrRandom !== 'boolean'
        ? generateParamAttributeValuesFromComponentParams(
            paramValuesOrComponentParamsOrRandom,
            isRandom,
          )
        : [];

  return {
    setNumber,
    paramValuesL: paramValues,
    paramValuesR: paramValues,
  };
}

function isAttributeValueArray(
  arr: AttributeValue[] | ComponentParam[],
): arr is AttributeValue[] {
  return (arr[0] as AttributeValue)?.value !== undefined;
}
