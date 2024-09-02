import * as dayjs from 'dayjs';
import { DateUtil } from '../util';

describe('DateUtil::Unit', () => {
  const dateUtil = new DateUtil();

  describe('Date', () => {
    it.each([
      {
        range: [[0, 7], [10, 15], [20, 25]],
        expected: [[8, 9], [16, 19]],
      },
      {
        range: [[0, 7], [10, 15], [20, 25], [30, 35]],
        expected: [[8, 9], [16, 19], [26, 29]],
      },
      {
        range: [[0, 1]],
        expected: [],
      },
      {
        range: [[0, 1], [2, 3]],
        expected: [],
      },
    ])('should return negated date range union', ({ range, expected }) => {
      const union = getDatesFromRange(range);
      const negated = getDatesFromRange(expected);

      const result = dateUtil.negateRange(union);
      expect(result).toEqual(negated);
    });
  });
});

function getDatesFromRange(range: number[][]): Date[][] {
  return range.map(date => [
    dayjs('2024-1-1').add(date[0], 'day').toDate(),
    dayjs('2024-1-1').add(date[1], 'day').toDate(),
  ]);
}