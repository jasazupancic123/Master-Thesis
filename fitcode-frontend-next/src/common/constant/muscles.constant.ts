import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/controller/attribute/type/attribute.type';

export const MUSCLES_FRONT: Attribute[] = [
  {
    field: 'biceps_brachi',
    name: 'Biceps Brachi',
    type: AttributeType.Multiselect, // if nested put select, leafes have number
    options: [
      {
        field: 'short_biceps_brachi',
        name: 'Short Biceps Brachi',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'short_biceps_brachi-r',
            name: 'Short Biceps Brachi R',
            type: AttributeType.Number,
          },
          {
            field: 'short_biceps_brachi-l',
            name: 'Short Biceps Brachi L',
            type: AttributeType.Number,
          },
        ],
      },
      {
        field: 'long_biceps_brachi',
        name: 'Long Biceps Brachi',
        type: AttributeType.Multiselect,
        options: [
          {
            field: 'long_biceps_brachi-r',
            name: 'Long Biceps Brachi R',
            type: AttributeType.Number,
          },
          {
            field: 'long_biceps_brachi-l',
            name: 'Long Biceps Brachi L',
            type: AttributeType.Number,
          },
        ],
      },
    ],
  },
];
