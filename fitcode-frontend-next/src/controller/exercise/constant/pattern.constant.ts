import type { Attribute } from '@/controller/attribute/type/attribute.type';

export const Pattern: Attribute[] = [
  { field: 'primitive', name: 'Primitive' },
  { field: 'torsion', name: 'Torsion' },
  { field: 'push', name: 'Push' },
  { field: 'pull', name: 'Pull' },
  { field: 'legs', name: 'Legs' },
  { field: 'squat', name: 'Squat' },
  { field: 'press', name: 'Press' },
  { field: 'jump', name: 'Jump' },
  { field: 'walk', name: 'Walk' },
  { field: 'run', name: 'Run' },
  { field: 'crawl', name: 'Crawl' },
  { field: 'carry', name: 'Carry' },
  { field: 'dl-hinge', name: 'Deadlift / Hinge' },
] as const;
