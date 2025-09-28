import { generateRandomString } from '@src/common/utils/random.util';

import type { AttributeValue } from '../entity/attribute-value.entity';

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
