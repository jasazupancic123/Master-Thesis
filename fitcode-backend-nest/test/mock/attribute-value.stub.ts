import { generateRandomString } from '../utils/random.util';
import { AttributeValue } from '../../src/attribute/entity/attribute-value.entity';
import { ExerciseAttributeValue } from '../../src/exercise/entity/exercise-attribute-value.entity';

export function generateAttributeValueStub(
  data?: Partial<AttributeValue>,
): AttributeValue {
  const value = data?.value || generateRandomString();

  return {
    field: data?.field || generateRandomString(),
    value: value,
    selected: data?.selected || value,
  };
}

export function generateExerciseAttributeValueStub(
  data?: Partial<ExerciseAttributeValue>,
): ExerciseAttributeValue {
  const value = data?.value || generateRandomString();

  return {
    exerciseId: data?.exerciseId,
    ownerId: data?.ownerId,
    field: data?.field || generateRandomString(),
    value: value,
    selected: data?.selected || value,
  };
}
