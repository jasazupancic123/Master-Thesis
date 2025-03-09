import { AttributeType } from '../../common/enum/attribute-type.enum';
import { Attribute } from '../../attribute/entity/attribute.entity';
import { EFFORT, TEMPO } from './tempo-effort.constant';

/**
 * When filtering for component, add required and defaultValue
 * based on component.
 */
export const VOL_WORK_SETS: Attribute = {
  field: 'set',
  name: 'Set',
  type: AttributeType.Number,
  required: true,
  defaultValue: '3',
};

/**
 * When filtering for component, add default chosen option and
 * filter options based on component and add default values for
 * each option. Also, there can be multiple volume work fields
 * (vol1, vol2, volRec), in that case, change field name.
 */
export const VOL_WORK: Attribute = {
  field: 'vol1',
  name: 'VO2',
  type: AttributeType.Select,
  required: true,
  defaultValue: 'rep',
  options: [
    {
      field: 'rep',
      name: 'Rep',
      type: AttributeType.Number,
      defaultValue: '12',
    },
    {
      field: 'time',
      name: 'Time',
      unit: 's',
      type: AttributeType.Number,
      defaultValue: '60',
    },
    {
      field: 'dist',
      name: 'Dist',
      unit: 'm',
      type: AttributeType.Number,
      defaultValue: '60',
    },
  ],
};

/**
 * When filtering for component, add default chosen option and
 * filter options based on component and add default values for
 * each option. Also, there can be multiple intensity work fields
 * (int1, int2, intRec), in that case, change field name.
 */
export const INT_WORK: Attribute = {
  field: 'int1',
  name: 'INT',
  type: AttributeType.Select,
  required: true,
  options: [
    {
      field: 'kg',
      name: 'KG',
      unit: 'kg',
      type: AttributeType.Number,
      defaultValue: '20',
    },
    {
      field: 'bw',
      name: 'BW',
      unit: '%',
      type: AttributeType.Number,
      defaultValue: '100',
    },
    {
      field: 'rm',
      name: 'RM',
      type: AttributeType.Number,
      defaultValue: '100',
    },
    {
      field: 'mas',
      name: 'MAS',
      unit: '%',
      type: AttributeType.Number,
      defaultValue: '100',
    },
    {
      field: 'hrmax',
      name: 'HRMAX',
      unit: '%',
      type: AttributeType.Number,
      defaultValue: '100',
    },
    TEMPO,
    EFFORT,
  ],
};
