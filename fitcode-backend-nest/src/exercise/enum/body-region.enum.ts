import type { Attribute } from '@src/attribute/entity/attribute.entity';

export const BodyRegion: Attribute[] = [
  { field: 'upper', name: 'Upper' },
  { field: 'lower', name: 'Lower' },
  { field: 'core', name: 'Core' },
  { field: 'total', name: 'Total' },
];

export const BodyRegionValues = BodyRegion.map((b) => b.field);
