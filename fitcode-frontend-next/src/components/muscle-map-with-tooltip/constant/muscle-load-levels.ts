import { MuscleColorLevelType } from '../types/muscle-load-level';

export const MUSCLE_LOAD_LEVELS: MuscleColorLevelType[] = [
  {
    id: '1',
    min: 1,
    max: 3,
    colors: ['#F5FF99', '#EAFF48', '#FFD62A'], // for different rep values
  },
  {
    id: '2',
    min: 4,
    max: 6,
    colors: ['#FFAC1C', '#FF7B00', '#FF4E00'],
  },
  {
    id: '3',
    min: 7,
    max: 10,
    colors: ['#E02600', '#B30F00', '#7A0000'],
  },
];
