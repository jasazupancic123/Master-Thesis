import type { Attribute } from '@src/attribute/entity/attribute.entity';

export const Location: Attribute[] = [
  { field: 'gym', name: 'Gym' },
  { field: 'pitch', name: 'Pitch' },
  { field: 'mobile', name: 'Mobile' },
];

export const LocationValues = Location.map((l) => l.field);
