import type { Target } from '../entity/target.entity';

export const Targets: Target[] = [
  {
    field: 'not-important',
    name: 'NI',
    color: '#d2ee2d',
    componentId: 'competition',
  },
  {
    field: 'important',
    name: 'I',
    color: '#d87d40',
    componentId: 'competition',
  },
  {
    field: 'very-important',
    name: 'VI',
    color: '#f02846',
    componentId: 'competition',
  },
  {
    field: 'aerobic-power',
    name: 'Aerobic Power',
    color: '#9a73e0',
    componentId: 'endurance',
  },
  {
    field: 'anaerobic-power',
    name: 'Anaerobic Power',
    color: '#4a78cc',
    componentId: 'endurance',
  },
  {
    field: 'aerobic-capacity',
    name: 'Aerobic Capacity',
    color: '#bb9d4e',
    componentId: 'endurance',
  },
  {
    field: 'anaerobic-capacity',
    name: 'Anaerobic Capacity',
    color: '#1136cf',
    componentId: 'endurance',
  },
  {
    field: 'flexibility',
    name: 'Flexibility',
    color: '#d2ee2d',
    componentId: 'rom',
  },
  { field: 'mobility', name: 'Mobility', color: '#d87d40', componentId: 'rom' },
  { field: 'cod', name: 'COD', color: '#e5576b', componentId: 'speed' },
  {
    field: 'peak-speed',
    name: 'Peak Speed',
    color: '#20d34d',
    componentId: 'speed',
  },
  { field: 'agility', name: 'Agility', color: '#2c54f2', componentId: 'speed' },
  {
    field: 'acceleration',
    name: 'Acceleration',
    color: '#951fe9',
    componentId: 'speed',
  },
  {
    field: 'deceleration',
    name: 'Deceleration',
    color: '#f25a1f',
    componentId: 'speed',
  },
  {
    field: 'general',
    name: 'General',
    color: '#201f97',
    componentId: 'strength',
  },
  { field: 'power', name: 'Power', color: '#eb6683', componentId: 'strength' },
  {
    field: 'plyometric',
    name: 'Plyometric',
    color: '#619eae',
    componentId: 'strength',
  },
] as const;
