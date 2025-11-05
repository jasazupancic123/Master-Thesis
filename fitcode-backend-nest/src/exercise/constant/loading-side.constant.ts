import type { Attribute } from '@src/attribute/entity/attribute.entity';

export const LoadingSide: Attribute[] = [
  { field: 'unilateral', name: 'Unilateral' },
  { field: 'bilateral', name: 'Bilateral' },
  { field: 'monopedal', name: 'Monopedal' },
  { field: 'bipedal', name: 'Bipedal' },
  { field: 'quadruped', name: 'Quadruped' },
] as const;

export const LoadingSideValues = LoadingSide.map((l) => l.field);
