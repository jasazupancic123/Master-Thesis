import type { Method } from '../type/method.type';

export const Methods: Method[] = [
  {
    field: 'maximal-set-exhaustive',
    name: 'Maximal Set Exhaustive',
    componentId: 'strength',
    description: 'Muscle Hypertrophy',
    attributes: [
      { field: 'sets', min: 5, max: 10 },
      { field: 'reps', min: 5, max: 12 },
      { field: 'eff', min: 2, max: 3 },
      { field: 'tempo', pattern: '^(?:[1-3]):(?:[1-2]):(?:[1-3]):(?:[0-4])$' }, // 1-3:1-2:1-3:0-4
      { field: 'recTime', min: 60, max: 60 },
    ],
  },
  {
    field: 'agility-strength',
    name: 'Agility Strength',
    componentId: 'strength',
    description: 'Sport Specific Pattern',
    attributes: [
      { field: 'sets', min: 3, max: 10 },
      { field: 'reps', min: 2, max: 8 },
      { field: 'eff', min: 1, max: 2 },
      { field: 'tempo', disabled: true },
      { field: 'recTime', min: 60, max: 60 },
    ],
  },
  {
    field: 'heavy-power-heavy-rfd',
    name: 'Heavy Power / Heavy RFD',
    componentId: 'strength',
    description: 'Maximal Muscle Power / Late RFD',
    attributes: [
      { field: 'sets', min: 4, max: 6 },
      { field: 'reps', min: 3, max: 6 },
      { field: 'eff', min: 4, max: 4 },
      { field: 'tempo', disabled: true },
      { field: 'recTime', min: 120, max: 180 },
    ],
  },
  {
    field: 'deceleration-braking',
    name: 'Deceleration Braking',
    componentId: 'strength',
    description: 'Eccentric RFD',
    attributes: [
      { field: 'sets', min: 5, max: 8 },
      { field: 'reps', min: 3, max: 5 },
      { field: 'tempo', pattern: '^(?:\d+):(?:[1-3]):(?:1):(?:\d+)$' },
      { field: 'recTime', min: 90, max: 120 },
    ],
  },
  {
    field: 'light-power-light-rfd',
    name: 'Light Power/Light RFD',
    componentId: 'strength',
    description: 'Maximal Muscular Power / Starting RFD',
    attributes: [
      { field: 'sets', min: 5, max: 8 },
      { field: 'reps', min: 5, max: 8 },
      { field: 'eff', min: 1, max: 3 },
      { field: 'tempo', disabled: true },
      { field: 'recTime', min: 60, max: 90 },
    ],
  },
  {
    field: 'slow-tempo-exhaustive',
    name: 'Slow Tempo Exhaustive',
    componentId: 'strength',
    description: 'Muscle Hypertrophy',
    attributes: [
      { field: 'sets', min: 3, max: 5 },
      { field: 'reps', min: 5, max: 8 },
      { field: 'eff', min: 2, max: 3 },
      { field: 'tempo', pattern: '^(?:[4-6]):(?:[1-3]):(?:[4-6]):(?:[0-4])$' },
      { field: 'recTime', min: 60, max: 90 },
    ],
  },
  {
    field: 'maximal-rep-exhaustive',
    name: 'Maximal Rep Exhaustive',
    componentId: 'strength',
    description: 'Muscle Hypertrophy',
    attributes: [
      { field: 'sets', min: 3, max: 4 },
      { field: 'reps', min: 5, max: 12 },
      { field: 'eff', min: 3, max: 4 },
      { field: 'tempo', pattern: '^(?:[2-4]):(?:[1-3]):(?:[1-3]):(?:[0-4])$' },
      { field: 'recTime', min: 60, max: 90 },
    ],
  },
  {
    field: 'technical-development',
    name: 'Technical Development',
    componentId: 'strength',
    description: 'Safe Efficient Movement',
    attributes: [
      { field: 'sets', min: 3, max: 10 },
      { field: 'reps', min: 2, max: 8 },
      { field: 'eff', min: 1, max: 2 },
      { field: 'tempo', disabled: true },
      { field: 'recTime', min: 30, max: 90 },
    ],
  },
  {
    field: 'corrective-strength',
    name: 'Corrective Strength',
    componentId: 'strength',
    description: 'Structural Balance',
    attributes: [
      { field: 'sets', min: 2, max: 4 },
      { field: 'reps', min: 8, max: 15 },
      { field: 'tempo', pattern: '^(?:[1-3]):(?:[1-3]):(?:[1-3])$' }, // 1-3:1-3:1-3
      { field: 'recTime', min: 60, max: 60 },
    ],
  },
  {
    field: 'maximal-eccentric-strength',
    name: 'Maximal Eccentric Strength',
    componentId: 'strength',
    description: 'Maximal Eccentric Muscular Strength',
    attributes: [
      { field: 'sets', min: 3, max: 5 },
      { field: 'reps', min: 3, max: 5 },
      { field: 'tempo', pattern: '^(?:2|[3-9]|10):0$' }, // 2-10:0
      { field: 'recTime', min: 120, max: 120 },
    ],
  },
  {
    field: 'maximal-strength',
    name: 'Maximal Strength',
    componentId: 'strength',
    description: 'Maximal Muscular Strength',
    attributes: [
      { field: 'sets', min: 3, max: 5 },
      { field: 'reps', min: 1, max: 5 },
      { field: 'tempo', pattern: '^(?:2|3|4):(?:1|2|3)$' }, // 2-4:1-3
      { field: 'recTime', min: 120, max: 120 },
    ],
  },
  {
    field: 'reactive-strength',
    name: 'Reactive Strength',
    componentId: 'strength',
    description: 'Stretch Shortening Cycle',
    attributes: [
      { field: 'sets', min: 3, max: 6 },
      { field: 'reps', min: 6, max: 10 },
      { field: 'recTime', min: 60, max: 120 },
    ],
  },
  {
    field: 'low-load-exhaustive',
    name: 'Low Load Exhaustive',
    componentId: 'strength',
    description: 'Muscle Hypertrophy/Strength Endurance',
    attributes: [
      { field: 'sets', min: 2, max: 4 },
      { field: 'reps', min: 15, max: 30 },
      { field: 'tempo', pattern: '^(?:[1-9]|1-2):0:1$' }, // 1-2:0:1
      { field: 'recTime', min: 60, max: 60 },
    ],
  },
  {
    field: 'vo2max',
    name: 'VO2max',
    componentId: 'endurance',
    description: 'Long HIT',
    attributes: [
      { field: 'sets', min: 5, max: 8 },
      { field: 'time', min: 120, max: 180 },
      { field: 'eff', min: 4, max: 4 },
      { field: 'recTime', min: 120, max: 180 },
    ],
  },
  {
    field: 'repeat-sprints',
    name: 'Repeat Sprints',
    componentId: 'endurance',
    description: 'RST',
    attributes: [
      { field: 'time', min: 4, max: 6 },
      { field: 'recTime', min: 20, max: 20 },
    ],
  },
  {
    field: 'extensive-intervals',
    name: 'Extensive Intervals',
    componentId: 'endurance',
    description: 'Long HIT',
    attributes: [
      { field: 'time', min: 120, max: 240 },
      { field: 'recTime', min: 60, max: 60 },
    ],
  },
  {
    field: 'lactic-power',
    name: 'Lactic Power',
    componentId: 'endurance',
    description: 'SIT',
    attributes: [
      { field: 'time', min: 30, max: 30 },
      { field: 'recTime', min: 240, max: 240 },
    ],
  },
  {
    field: 'buchheit-tempo-1',
    name: 'Buchheit / Tempo 1',
    componentId: 'endurance',
    description: 'Short HIT',
    attributes: [
      { field: 'time', min: 10, max: 10 },
      { field: 'recTime', min: 20, max: 120 },
    ],
  },
  {
    field: 'buchheit-tempo-2',
    name: 'Buchheit / Tempo 2',
    componentId: 'endurance',
    description: 'Short HIT',
    attributes: [
      { field: 'time', min: 10, max: 10 },
      { field: 'recTime', min: 20, max: 60 },
    ],
  },
  {
    field: 'joel-jamieson-aerobic-explosive-repeat',
    name: 'Joel Jamieson Aerobic Explosive Repeat',
    componentId: 'endurance',
    description: 'Short HIT',
    attributes: [
      { field: 'time', min: 10, max: 10 },
      { field: 'recTime', min: 60, max: 180 },
    ],
  },
  {
    field: 'lactate-threshold',
    name: 'Lactate Threshold',
    componentId: 'endurance',
    description: 'Threshold',
    attributes: [
      { field: 'time', min: 480, max: 600 },
      { field: 'recTime', min: 240, max: 300 },
    ],
  },
  {
    field: 'continuous-intensive-tempo',
    name: 'Continuous Intensive (Tempo)',
    componentId: 'endurance',
    description: 'Continuous',
    attributes: [{ field: 'time', min: 1800, max: 5400 }],
  },
  {
    field: 'vo2max-2',
    name: 'VO2max',
    componentId: 'endurance',
    description: 'Long HIT',
    attributes: [
      { field: 'time', min: 180, max: 240 },
      { field: 'recTime', min: 180, max: 180 },
    ],
  },
  {
    field: 'extensive-intervals-2',
    name: 'Extensive Intervals',
    componentId: 'endurance',
    description: 'Long HIT',
    attributes: [
      { field: 'time', min: 120, max: 240 },
      { field: 'recTime', min: 60, max: 120 },
    ],
  },
  {
    field: 'continuous-extensive',
    name: 'Continuous Extensive',
    componentId: 'endurance',
    description: 'Continuous',
    attributes: [{ field: 'time', min: 2400, max: 7200 }],
  },
  {
    field: 'dynamic-stretching',
    name: 'Dynamic Stretching',
    componentId: 'rom',
    description: 'Warm-up, improve dynamic flexibility',
    attributes: [
      { field: 'reps', min: 10, max: 15 },
      { field: 'recTime', min: 0, max: 0 },
    ],
  },
  {
    field: 'static-stretching',
    name: 'Static Stretching',
    componentId: 'rom',
    description: 'Improve overall flexibility',
    attributes: [
      { field: 'time', min: 15, max: 60 },
      { field: 'recTime', min: 0, max: 0 },
    ],
  },
  {
    field: 'joint-circles-and-mobility-drills',
    name: 'Joint Circles and Mobility Drills',
    componentId: 'rom',
    description: 'Improve joint health and range of motion',
    attributes: [
      { field: 'reps', min: 10, max: 15 },
      { field: 'recTime', min: 0, max: 0 },
    ],
  },
  {
    field: 'active-isolated-stretching',
    name: 'Active Isolated Stretching',
    componentId: 'rom',
    description: 'Enhance flexibility, improve muscle function',
    attributes: [
      { field: 'reps', min: 8, max: 12 },
      { field: 'recTime', min: 0, max: 0 },
    ],
  },
  {
    field: 'yoga',
    name: 'Yoga',
    componentId: 'rom',
    description: 'Improve flexibility, balance, and mental focus',
    attributes: [
      { field: 'time', min: 30, max: 90 },
      { field: 'recTime', min: 0, max: 0 },
    ],
  },
  {
    field: 'pnf-stretching',
    name: 'PNF Stretching',
    componentId: 'rom',
    description: 'Enhance flexibility and range of motion',
    attributes: [
      { field: 'time', min: 5, max: 30 },
      { field: 'recTime', min: 20, max: 30 },
    ],
  },
  {
    field: 'foam-rolling',
    name: 'Foam Rolling',
    componentId: 'rom',
    description: 'Release muscle tightness, improve tissue quality',
    attributes: [
      { field: 'time', min: 60, max: 120 },
      { field: 'recTime', min: 30, max: 60 },
    ],
  },
];
