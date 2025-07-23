import { AttributeType } from '@src/common/enum/attribute-type.enum';
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
  };
}

export function generateMultiselectAttribute(): Attribute {
  return generateAttributeStub({
    field: 'root',
    name: 'Root',
    required: true,
    type: AttributeType.Multiselect,
    options: [
      generateAttributeStub({
        field: 'first',
        name: 'Root First',
        type: AttributeType.Multiselect,
        options: [
          generateAttributeStub({
            field: 'a',
            name: 'Option A (value)',
            type: AttributeType.Value,
          }),
          generateAttributeStub({
            field: 'b',
            name: 'Option B (value)',
            type: AttributeType.Value,
          }),
          generateAttributeStub({
            field: 'c',
            name: 'Option C (string)',
            type: AttributeType.String,
          }),
        ],
      }),
      generateAttributeStub({
        field: 'second',
        name: 'Root Second',
        type: AttributeType.Multiselect,
        options: [
          generateAttributeStub({
            field: 'a',
            name: 'Option A (number)',
            type: AttributeType.Number,
          }),
          generateAttributeStub({
            field: 'b',
            name: 'Option B (bool)',
            type: AttributeType.Boolean,
          }),
        ],
      }),
    ],
  });
}
