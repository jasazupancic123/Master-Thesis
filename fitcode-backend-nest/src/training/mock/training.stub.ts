import { addDays, addHours } from 'date-fns';
import { v4 } from 'uuid';

import { getTime } from '@src/common/service/util/date.util';
import { generateRandomName } from '@src/common/utils/random.util';

import type { ExerciseSet } from '../entity/exercise-set.entity';
import type { Subgroup } from '../entity/subgroup.entity';
import type { Superset } from '../entity/superset.entity';
import type { Training } from '../entity/training.entity';
import type { TrainingComponent } from '../entity/training-component.entity';
import type { TrainingExercise } from '../entity/training-exercise.entity';
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
    targetId: data?.targetId || null,
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
  params?: Partial<ExerciseSet>,
): ExerciseSet {
  // defaults
  const set: ExerciseSet = { setNumber };
  if (params && typeof params === 'object' && !Array.isArray(params))
    Object.assign(set, params);

  return set;
}
