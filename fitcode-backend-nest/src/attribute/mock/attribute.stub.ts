import { AttributeType } from '@src/attribute/enum/attribute-type.enum';
import {
  generateRandomName,
  generateRandomString,
} from '@src/common/utils/random.util';

import type { Attribute } from '../entity/attribute.entity';

export function generateAttributeStub(data?: Partial<Attribute>): Attribute {
  return {
    field: data?.field || generateRandomString(),
    name: data?.name || generateRandomName(),
    options: data?.options,
    type: data?.type || AttributeType.String,
    required: data?.required || false,
    unit: data?.unit || '',
    defaultValue: data?.defaultValue,
    description: data?.description || '',
    min: data?.min,
    max: data?.max,
  };
}
