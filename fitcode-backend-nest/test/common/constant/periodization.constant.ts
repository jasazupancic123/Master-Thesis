import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

export const PERIODIZATION_TEST_VALUES = [
  {
    type: PeriodizationType.REPLICATE,
    expected: [
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
    ],
  },
  {
    type: PeriodizationType.LINEAR,
    expected: [
      { int: 20, vol: 12 },
      { int: 22, vol: 11 },
      { int: 24, vol: 10 },
      { int: 26, vol: 9 },
      { int: 28, vol: 8 },
      { int: 30, vol: 7 },
    ],
  },
  {
    type: PeriodizationType.WEEK_UNDULATING,
    expected: [
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
      { int: 22, vol: 11 },
      { int: 18, vol: 13 },
      { int: 16, vol: 14 },
    ],
  },
  {
    type: PeriodizationType.DAY_UNDULATING,
    expected: [
      { int: 20, vol: 12 },
      { int: 22, vol: 11 },
      { int: 18, vol: 13 },
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
      { int: 20, vol: 12 },
    ],
  },
  {
    type: PeriodizationType.BLOCK,
    expected: [
      { int: 14, vol: 8 },
      { int: 14, vol: 8 },
      { int: 14, vol: 8 },
      { int: 14, vol: 8 },
      { int: 16, vol: 5 },
      { int: 18, vol: 3 },
    ],
  },
  {
    type: PeriodizationType.WAVE,
    expected: [
      { int: 16, vol: 5 },
      { int: 16, vol: 5 },
      { int: 16, vol: 5 },
      { int: 18, vol: 3 },
      { int: 16, vol: 5 },
      { int: 16, vol: 5 },
    ],
  },
  {
    type: PeriodizationType.DUP_TABLE_BASED, // type dupTableBased is not supported yet
    expected: [],
  },
];
