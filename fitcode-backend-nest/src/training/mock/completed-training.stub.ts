import type { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { DEFAULT_PARAMS_KEY } from '@src/component/constant/param.constant';
import type { Component } from '@src/component/entity/component.entity';
import type { ComponentParam } from '@src/component/entity/component-param.entity';
import { ParamType } from '@src/component/enum/param.enum';

import type { CompletedTrainingExercise } from '../entity/completed-training.entity';
import type { ExerciseSet } from '../entity/exercise-set.entity';
import { generateExerciseSet } from './training.stub';

export function generateCompletedTrainingExerciseStub(
  component: Component,
  sets: number, // how many sets to generate
  data?: Partial<CompletedTrainingExercise> & {
    paramsKey?: string;
    customComponentParams?: ComponentParam[] | AttributeValue[];
    random?: boolean; // random values for params
  },
): CompletedTrainingExercise {
  const random = data?.random || false;
  const paramsKey = data?.paramsKey || DEFAULT_PARAMS_KEY;
  const componentParams =
    data?.customComponentParams || component?.params?.[paramsKey] || [];

  // generate sets based on component params
  const exerciseSets: ExerciseSet[] = [];
  if (!data?.sets) {
    for (let setNumber = 1; setNumber <= sets; setNumber++) {
      if (componentParams.find((p) => p.field === ParamType.VolWorkSets))
        continue; // special param that is always present

      exerciseSets.push(
        generateExerciseSet(setNumber, componentParams, { random }),
      );
    }
  }

  return {
    id: data?.id,
    supersetIndex: data?.supersetIndex || 0,
    sets: data?.sets || exerciseSets,
  };
}
