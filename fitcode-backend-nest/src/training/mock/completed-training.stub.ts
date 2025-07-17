import type { ComponentParam } from '@src/component/entity/component-param.entity';

import type { CompletedTrainingExercise } from '../entity/completed-training.entity';
import type { ExerciseSet } from '../entity/exercise-set.entity';
import { generateParamAttributeValuesFromComponentParams } from './param-values.stub';

export function generateCompletedTrainingExerciseStub(
  data?: Partial<CompletedTrainingExercise> & {
    generateValidSetsOptions?: {
      componentParams?: ComponentParam[]; // params to generate sets for
      sets?: number; // how many sets to generate
      random?: boolean; // if true, generate random values for params, else use defaults
    };
  },
): CompletedTrainingExercise {
  const generatedExerciseSets: ExerciseSet[] = [];

  if (data?.generateValidSetsOptions?.componentParams) {
    // generate sets based on component params
    const { componentParams, sets = 1, random } = data.generateValidSetsOptions;

    for (let setNumber = 1; setNumber < sets + 1; setNumber++) {
      const paramValues = generateParamAttributeValuesFromComponentParams(
        componentParams,
        random,
      );

      generatedExerciseSets.push({
        setNumber,
        paramValuesL: paramValues,
        paramValuesR: paramValues,
      });
    }
  }

  return {
    id: data?.id,
    supersetIndex: data?.supersetIndex || 0,
    sets: data?.sets || generatedExerciseSets,
  };
}
