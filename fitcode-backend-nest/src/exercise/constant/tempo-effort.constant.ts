import { AttributeType } from '../../common/enum/attribute-type.enum';
import { Attribute } from '../../attribute/entity/attribute.entity';

export const EFFORT: Attribute = {
  field: 'eff',
  name: 'Eff',
  type: AttributeType.Select,
  required: true,
  defaultValue: 'mod',
  options: [
    { field: 'easy', name: 'Easy', type: AttributeType.Value },
    { field: 'mod', name: 'Mod', type: AttributeType.Value },
    { field: 'hard', name: 'Hard', type: AttributeType.Value },
    { field: 'max', name: 'Max', type: AttributeType.Value },
  ],
};

export const TEMPO: Attribute = {
  field: 'tempo',
  name: 'Tempo',
  type: AttributeType.Select,
  required: true,
  defaultValue: 'a',
  options: [
    { field: 'a', name: '0:0:0', type: AttributeType.Value },
    { field: 'b', name: '1:0:1', type: AttributeType.Value },
    { field: 'c', name: '2:0:1', type: AttributeType.Value },
    { field: 'd', name: '3:0:1', type: AttributeType.Value },
  ],
};
