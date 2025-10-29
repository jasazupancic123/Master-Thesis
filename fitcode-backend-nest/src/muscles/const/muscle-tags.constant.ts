import type { Attribute } from '@src/attribute/entity/attribute.entity';

const Level1Tags: Attribute[] = [
  { field: 'Upper', name: 'upper' },
  { field: 'Lower', name: 'lower' },
];

const Level2Tags: Attribute[] = [
  { field: 'Neck/Upper Back', name: 'Neck/Upper Back' },
  { field: 'Neck', name: 'Neck' },
  { field: 'Chest', name: 'Chest' },
  { field: 'Core', name: 'Core' },
  { field: 'Shoulder', name: 'Shoulder' },
  { field: 'Arm', name: 'Arm' },
  { field: 'Thigh', name: 'Thigh' },
  { field: 'Lower Leg', name: 'Lower Leg' },
  { field: 'Upper Back', name: 'Upper Back' },
  { field: 'Lower Back', name: 'Lower Back' },
];

const Level3Tags: Attribute[] = [
  { field: 'Trapezii', name: 'Trapezii' },
  { field: 'Scalenes', name: 'Scalenes' },
  { field: 'Sternocleidomastoid', name: 'Sternocleidomastoid' },
  { field: 'Longus Colli', name: 'Longus Colli' },
  { field: 'Pectoralis', name: 'Pectoralis' },
  { field: 'Serratus', name: 'Serratus' },
  { field: 'Abdominals', name: 'Abdominals' },
  { field: 'Scapulohumerals', name: 'Scapulohumerals' },
  { field: 'Deltoids', name: 'Deltoids' },
  { field: 'Upper Arm', name: 'Upper Arm' },
  { field: 'Forearm', name: 'Forearm' },
  { field: 'Quadriceps', name: 'Quadriceps' },
  { field: 'Hip Flexors', name: 'Hip Flexors' },
  { field: 'Hip Adductors', name: 'Hip Adductors' },
  { field: 'Hip Abductors', name: 'Hip Abductors' },
  { field: 'Hip Deep', name: 'Hip Deep' },
  { field: 'Tibia', name: 'Tibia' },
  { field: 'Calf', name: 'Calf' },
  { field: 'Paraspinal Muscles', name: 'Paraspinal Muscles' },
  { field: 'Rhomboids', name: 'Rhomboids' },
  { field: 'Rotator Cuff', name: 'Rotator Cuff' },
  { field: 'Gluteals', name: 'Gluteals' },
  { field: 'Hamstrings', name: 'Hamstrings' },
];

export const MuscleTags = [
  ...Level1Tags.map((l) => l.field),
  ...Level2Tags.map((l) => l.field),
  ...Level3Tags.map((l) => l.field),
];
