import { AttributeType } from '../../../src/common/enum/attribute-type.enum';
import { Attribute } from '../../../src/attribute/entity/attribute.entity';

export const ATTRIBUTE_ENDURANCE_OPTIONS: Attribute = {
  field: 'end-opts',
  name: 'Endurance options',
  type: AttributeType.Select,
  options: [
    {
      field: 'end-opt-2',
      name: 'Option 2',
      type: AttributeType.Value,
    },
    {
      field: 'end-opt-3',
      name: 'Option 3',
      type: AttributeType.Value,
    },
    {
      field: 'end-opt-4',
      name: 'Option 4',
      type: AttributeType.Value,
    },
  ],
};
