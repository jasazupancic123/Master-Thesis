import { IntType, ParamType, VolType } from '../../component/enum/param.enum';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { CompletedTrainingExercise } from '../entity/completed-training.entity';
import { generateRandomNumber } from '../../../test/common/utils/random.util';
import { ComponentParam } from '../../component/entity/component-param.entity';

export function generateCompletedTrainingExerciseStub(
  data?: Partial<CompletedTrainingExercise>,
): CompletedTrainingExercise {
  return {
    id: data?.id,
    supersetIndex: data?.supersetIndex || 0,
    sets: data?.sets || [],
  };
}

export function generateCompletedParamValues(
  componentParams: ComponentParam[],
): AttributeValue[] {
  const attributeValues: AttributeValue[] = [];

  for (const param of componentParams) {
    let value: number;
    let selected: string;

    switch (param.field) {
      case ParamType.VolWork1:
      case ParamType.VolWork2:
      case ParamType.VolRec1:
        selected = !param.options ? VolType.Rep : param.defaultValue;

        switch (selected) {
          case VolType.Rep:
            value = generateRandomNumber(1, 12);
            break;
          case VolType.Time:
            value = generateRandomNumber(60, 180);
            break;
          case VolType.Dist:
            value = generateRandomNumber(100, 200);
            break;
          default:
            throw new Error('Invalid default value');
        }

        break;
      case ParamType.IntWork1:
      case ParamType.IntWork2:
      case ParamType.IntRec1:
        selected = !param.options ? IntType.Kg : param.defaultValue;

        switch (selected) {
          case IntType.Kg:
          case IntType.Bw:
          case IntType.Rm:
            value = generateRandomNumber(50, 120); // for those options, kilograms are generated
            break;
          case IntType.Hrmax:
          case IntType.Mas:
            value = generateRandomNumber(0, 100); // percent
            break;
          case IntType.Eff:
          case IntType.Tempo:
            const random = generateRandomNumber(0, 3);
            selected = `${selected}:${random}`;
            value = random;
            break;
          default:
            throw new Error('Invalid default value');
        }

        break;
      case ParamType.VolWorkSets:
      default:
        break; // special param, not for input
    }

    attributeValues.push({
      field: param.field,
      selected,
      value: value.toString(),
    });
  }

  return attributeValues;
}
