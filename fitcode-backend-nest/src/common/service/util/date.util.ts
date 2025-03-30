import { addDays, isAfter, isBefore, isEqual, startOfWeek } from 'date-fns';
import dayjs from 'dayjs';
import { Week } from '../../../group/entity/cycle.entity';

export class DateUtil {
  isBetween(date: Date, start: Date, end: Date): boolean {
    return (
      isEqual(date, start) ||
      isEqual(date, end) ||
      (isAfter(date, start) && isBefore(date, end))
    );
  }

  isBefore(date: Date, compare: Date): boolean {
    return isBefore(date, compare);
  }

  isAfter(date: Date, compare: Date): boolean {
    return isAfter(date, compare);
  }

  isEqual(date: Date, compare: Date): boolean {
    return isEqual(date, compare);
  }

  doRangesOverlap(
    range1Start: Date,
    range1End: Date,
    range2Start: Date,
    range2End: Date,
  ): boolean {
    return isBefore(range1Start, range2End) && isAfter(range1End, range2Start);
  }

  /**
   * Returns an array of weeks between the start and end date. Each week
   * contains an array of days (7 days in a week), from Monday to Sunday.
   *
   * @example
   * getWeeksBetween(new Date('2021-01-01'), new Date('2021-01-15'))
   * // => [
   * //   [ { date: '2021-01-04' }, { date: '2021-01-05' }, ... ],
   * //   [ { date: '2021-01-11' }, { date: '2021-01-12' }, ... ],
   * // ]
   */
  weeks(startDate: Date, endDate: Date): Week[][] {
    const weeksArray: Week[][] = [];
    let currentDate = startOfWeek(startDate, { weekStartsOn: 1 }); // 1 = Monday

    while (isBefore(currentDate, endDate)) {
      const week: Week[] = [];
      for (let i = 0; i < 7; i++) {
        week.push({ date: new Date(currentDate) });
        currentDate = addDays(currentDate, 1);
      }

      weeksArray.push(week);
    }

    return weeksArray;
  }

  pretty(date: Date): string {
    return dayjs(date).format('DD MMM YYYY');
  }
}
