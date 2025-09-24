import type { Attribute } from '@src/attribute/entity/attribute.entity';

export const MovementDirection: Attribute[] = [
  { field: 'linear', name: 'Linear' },
  { field: 'lateral', name: 'Lateral' },
  { field: 'torsional', name: 'Torsional' },
];

export const MovementDirectionValues = MovementDirection.map((m) => m.field);
