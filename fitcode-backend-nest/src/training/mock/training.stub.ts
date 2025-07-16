import { addDays, addHours } from 'date-fns';
import { v4 } from 'uuid';
import {
  generateRandomColor,
  generateRandomName,
} from '../../../test/common/utils/random.util';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { getTime } from '../../common/service/util/date.util';
import { PARAMS } from '../../component/constant/param.constant';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '../../component/constant/warmup-cooldown.constant';
import { ComponentParam } from '../../component/entity/component-param.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Subgroup } from '../entity/subgroup.entity';
import { Superset } from '../entity/superset.entity';
import { TrainingComponent } from '../entity/training-component.entity';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { Training } from '../entity/training.entity';
import { generateParamAttributeValuesFromComponentParams } from './param-values.stub';

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

export function generateExerciseSet(setNumber: number): ExerciseSet;
export function generateExerciseSet(
  setNumber: number,
  paramValues: AttributeValue[],
): ExerciseSet;
export function generateExerciseSet(
  setNumber: number,
  componentParams: ComponentParam[],
): ExerciseSet;
/**
 * Generates an ExerciseSet object. If paramValuesOrComponentParams is not provided,
 * it generates random parameter values for the set, else it uses the provided values
 * by generating them from component parameters or using the provided AttributeValue
 * array as is.

 * @param setNumber - the number of the set
 * @param paramValues - array of AttributeValue objects for the set or componentParams
 * - array of ComponentParam objects to generate AttributeValues from
 */
export function generateExerciseSet(
  setNumber: number,
  paramValuesOrComponentParams?: AttributeValue[] | ComponentParam[],
): ExerciseSet {
  const paramValues = !paramValuesOrComponentParams
    ? generateParamAttributeValuesFromComponentParams(PARAMS, true)
    : isAttributeValueArray(paramValuesOrComponentParams)
      ? paramValuesOrComponentParams
      : generateParamAttributeValuesFromComponentParams(
          paramValuesOrComponentParams,
          true,
        );

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
