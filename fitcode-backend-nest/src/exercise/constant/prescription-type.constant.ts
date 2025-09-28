import type { Attribute } from '@src/attribute/entity/attribute.entity';

export const PrescriptionType: Attribute[] = [
  {
    field: 'ext-load-uni',
    name: 'External Load Unilateral',
  },
  {
    field: 'ext-load-bil',
    name: 'External Load Bilateral',
  },
  {
    field: 'mb-drills-uni',
    name: 'Medicine Ball Drills Unilateral',
  },
  {
    field: 'mb-drills-bil',
    name: 'Medicine Ball Drills Bilateral',
  },
  {
    field: 'rsi-drills-uni',
    name: 'Reactive Strength Index Drills Unilateral',
  },
  {
    field: 'rsi-drills-bil',
    name: 'Reactive Strength Index Drills Bilateral',
  },
] as const;

export const PrescriptionTypeValues = PrescriptionType.map((p) => p.field);
