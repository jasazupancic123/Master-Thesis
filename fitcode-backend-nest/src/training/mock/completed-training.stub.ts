import { generateRandomNumber } from '../../../test/common/utils/random.util';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { PARAMS } from '../../component/constant/param.constant';
import { ComponentParam } from '../../component/entity/component-param.entity';
import {
  IntType,
  ParamType,
  VolType,
  VolWorkSetType,
} from '../../component/enum/param.enum';
import { CompletedTrainingExercise } from '../entity/completed-training.entity';
import { ExerciseSet } from '../entity/exercise-set.entity';
import {
  ParamToSelectedMap,
  ValidParams,
} from '../interface/param-to-selected.interface';
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
