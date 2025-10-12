import { addDays, addHours } from 'date-fns';
import { v4 } from 'uuid';

import { getTime } from '@src/common/service/util/date.util';
import {
  generateRandomName,
  generateRandomNumber,
} from '@src/common/utils/random.util';
import {
  COOLDOWN_COMPONENT_ID,
  WARMUP_COMPONENT_ID,
} from '@src/component/constant/warmup-cooldown.constant';
import { ExerciseParam } from '@src/training/constant/exercise-param.constant';

import type { ExerciseSet } from '../entity/exercise-set.entity';
import type { Subgroup } from '../entity/subgroup.entity';
import type { Superset } from '../entity/superset.entity';
import type { Training } from '../entity/training.entity';
import type { TrainingComponent } from '../entity/training-component.entity';
import type { TrainingExercise } from '../entity/training-exercise.entity';
import { LoadType } from '../enum/load-type.enum';
import { MainSet } from '../enum/main-set.enum';

/**
 * Generates a training stub with default values or overrides from the provided data.
 * Note that in training service, `from` and `to` dates are calculated based on the
 * provided `components` dates (training's `from` and `to` cannot be set directly).
 * Here, we set `from` and `to` dates directly for simplicity and evenly space
 * the components in between them.
 */
export function generateTrainingStub(
  data?: Partial<Training> & {
    ownerId: string;
    membersIds: string[];
    components?: Omit<TrainingComponent, 'from' | 'to'>[];
    date?: Date;
  },
  options?: { disableAutomaticallySetComponentsDates?: boolean },
): Training {
  // evenly space components in between training's from and to dates
  const from = data?.from || data?.date || new Date();
  const to = data?.to || addHours(from, 2);

  const components: TrainingComponent[] = data?.components || [];
  if (
    components.length > 0 &&
    !options?.disableAutomaticallySetComponentsDates
  ) {
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
    institutionId: data?.institutionId,
    groupId: data?.groupId,
    cycleId: data?.cycleId,
    ownerId: data?.ownerId || global.trainer.uid,
    membersIds: data?.membersIds || [global.athlete.uid],
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
    from,
    to: data?.to || addHours(from, 1),
    target: data?.target || null,
    methodId: data?.methodId || null,
    mainSet: data?.mainSet || MainSet.BLOCK,
    supersets: data?.supersets || [],
    subgroups: data?.subgroups || [],
  };
}

export function generateSuperset(data?: Partial<Superset>): Superset {
  return {
    exercises: data?.exercises || [],
  };
}

export function generateSubgroup(data?: Partial<Subgroup>): Subgroup {
  return {
    id: data?.id ?? v4(),
    name: data?.name || generateRandomName(),
    membersIds: data?.membersIds || [],
    supersets: data?.supersets || [],
    mainSet: data?.mainSet || MainSet.BLOCK,
    parentId: data?.parentId || null,
  };
}

export function generateTrainingExercise(
  data?: Partial<TrainingExercise>,
): TrainingExercise {
  return {
    id: data?.id ?? v4(),
    params: data?.params || [],
    sets: data?.sets || [],
  };
}

type ExerciseSetOptions = {
  random?: boolean;
  isUnilateral?: boolean;
};

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

export function generateExerciseSet<T extends keyof ExerciseSet>(
  setNumber: number,
  params?: T[],
  options?: ExerciseSetOptions,
): ExerciseSet {
  const set: ExerciseSet = {
    setNumber,
    reps: ExerciseParam.REPS.defaultValue as number,
    recTime: ExerciseParam.REC_TIME.defaultValue as number,
    loadType: LoadType.Kg,
  };

  const _params = params || ExerciseParam.fields;
  for (const param of _params) {
    set[param as T] = generateParamValue(
      param,
      options?.random,
    ) as ExerciseSet[T];
  }

  return set;
}

function generateParamValue<T extends keyof ExerciseSet>(
  param: T,
  random?: boolean,
): ExerciseSet[T] {
  if (!random) return ExerciseParam.get(param).defaultValue as ExerciseSet[T];

  switch (param) {
    case 'reps':
    case 'repsR':
      return generateRandomNumber(3, 20) as ExerciseSet[T];
    case 'loadKg':
    case 'loadKgR':
      return generateRandomNumber(20, 120) as ExerciseSet[T];
    case 'loadRm':
    case 'loadRmR':
    case 'loadBw':
    case 'loadBwR':
      return generateRandomNumber(50, 100) as ExerciseSet[T];
    case 'tempo':
    case 'tempoR':
      const t = () => generateRandomNumber(0, 4);
      return `${t()}:${t()}:${t()}:${t()}` as ExerciseSet[T];
    case 'vel':
    case 'velR':
      return generateRandomNumber(1, 5) as ExerciseSet[T]; // in m/s
    case 'eff':
      return generateRandomNumber(1, 4) as ExerciseSet[T];
    case 'recTime':
    case 'time':
      return generateRandomNumber(30, 180) as ExerciseSet[T]; // in seconds
    case 'dist':
    case 'recDist':
      return generateRandomNumber(100, 1000) as ExerciseSet[T]; // in meters
  }
}
