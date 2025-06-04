/*
  NOTE: This test is to ensure that the import syntax when running tests for dayjs and its plugins works correctly.
*/

import * as dayjs from 'dayjs'; // works
import * as isoWeek from 'dayjs/plugin/isoWeek'; // works
// import dayjs from 'dayjs'; // fails test
// import isoWeek from 'dayjs/plugin/isoWeek'; // fails test

dayjs.extend(isoWeek);

test('dayjs works', () => {
  const result = dayjs().isoWeek();
  expect(typeof result).toBe('number');
});
