import { v4 } from 'uuid';
import { generateRandomName, generateRandomString } from '../utils/random.util';
import { Attribute } from '../../src/attribute/entity/attribute.entity';
import { AttributeType } from '../../src/common/enum/attribute-type.enum';

export function generateAttributeStub(data?: Partial<Attribute>): Attribute {
  const id = v4();
  return {
    field: data?.field || generateRandomString(),
    name: data?.name || generateRandomName(),
    options: data?.options,
    type: data?.type || AttributeType.String,
    required: data?.required || false,
    unit: data?.unit || '',
    defaultValue: data?.defaultValue,
  };
}
