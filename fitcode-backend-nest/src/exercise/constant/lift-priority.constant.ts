import type { Attribute } from '@src/attribute/entity/attribute.entity';

export const LiftPriority: Attribute[] = [
  { field: 'main', name: 'Main' },
  { field: 'assistance', name: 'Assistance' },
  { field: 'supplemental', name: 'Supplemental' },
  { field: 'corrective', name: 'Corrective' },
] as const;

export const LiftPriorityValues = LiftPriority.map((l) => l.field);
