import { generateRandomString } from '../../../test/common/utils/random.util';
import { AttributeValue } from '../entity/attribute-value.entity';
import { ExerciseAttributeValue } from '../../exercise/entity/exercise-attribute-value.entity';
import { v4 } from 'uuid';

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
    id: data?.id || v4(),
    exerciseId: data?.exerciseId,
    ownerId: data?.ownerId,
    field: data?.field || generateRandomString(),
    value: value,
    selected: data?.selected || value,
    componentIds: data?.componentIds || ['other'],
  };
}
