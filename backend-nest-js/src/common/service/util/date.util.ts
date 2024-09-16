import { Week } from '../../../group/entity/cycle.entity';
import dayjs from 'dayjs';
import { isAfter, isBefore, isEqual } from 'date-fns';

export class DateUtil {
  isBetween(date: Date, start: Date, end: Date): boolean {
    return (
      isEqual(date, start) ||
      isEqual(date, end) ||
      (isAfter(date, start) && isBefore(date, end))
    );
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
    let weeks: Week[][] = [];
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    let startDateWeekStart = start.startOf('week').add(1, 'day');
    let endDateWeekEnd = end.endOf('week').add(1, 'day');

    // if start day is sunday, subtract 7 days
    if (start.day() === 0) {
      startDateWeekStart = startDateWeekStart.subtract(7, 'day');
      endDateWeekEnd = endDateWeekEnd.subtract(7, 'day');
    }

    const totalDays = endDateWeekEnd.diff(startDateWeekStart, 'day') + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    let date = startDateWeekStart;
    for (let i = 0; i < totalWeeks; i++) {
      const week: Week[] = Array(7).fill(null);
      for (let day = 0; day < 7; day++) {
        week[day] = { date: date.toDate() };
        date = date.add(1, 'day');
      }

      weeks.push(week);
    }

    return weeks;
  }

  pretty(date: Date): string {
    return dayjs(date).format('DD MMM YYYY');
  }
}
