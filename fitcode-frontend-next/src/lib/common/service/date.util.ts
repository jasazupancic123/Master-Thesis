import {
  addDays,
  type Day as DayDateFns,
  isBefore,
  startOfWeek,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { getWeekStartByLocale } from 'weekstart';

import type { Week } from '@/core/group/type/cycle.type';

export type Day = {
  label: string;
  date: Dayjs;
};

export class DateUtil {
  format(
    date: Dayjs | Date,
    options: { withYear?: boolean; withMonth?: boolean; withoutDots?: boolean },
    formula?: string
  ): string {
    if (formula) return dayjs(date).format(formula);

    const format =
      `DD${options.withMonth ? '. MM.' : ''}${options.withYear ? '. YYYY' : ''}`.replace(
        '.',
        options.withoutDots ? '' : '.'
      );
    return dayjs(date).format(format);
  }

  formatTime(date: Dayjs | Date): string {
    return dayjs(date).format('HH:mm');
  }

  isBetween(
    date: Date | Dayjs,
    startDate: Date | Dayjs,
    endDate: Date | Dayjs
  ): boolean {
    date = dayjs(date);
    startDate = dayjs(startDate);
    endDate = dayjs(endDate);

    return (
      date.isSame(startDate, 'day') ||
      date.isSame(endDate, 'day') ||
      (date.isAfter(startDate, 'day') && date.isBefore(endDate, 'day'))
    );
  }

  isSameDay(date1: Dayjs, date2: Dayjs): boolean {
    return date1.startOf('day').isSame(date2.startOf('day'), 'day');
  }

  getWeekDays(day = dayjs()): Day[] {
    // USE THIS FOR CUSTOM WEEK STARTS
    /*
    const weekStart = startOfWeek(day.toDate(), {
      weekStartsOn: this.getWeekStartsOn(),
    });
    const weekEnd = startOfWeek(day.toDate(), {
      weekStartsOn: this.getWeekEndsOn(),
    });
    */

    let start = day.startOf('week').add(1, 'day');
    let end = day.endOf('week').add(1, 'day');

    // if today is sunday, subtract 6 days
    if (day.day() === 0) {
      start = start.subtract(7, 'day');
      end = end.subtract(7, 'day');
    }

    const days: Day[] = [];

    let date = dayjs(toZonedTime(start.toDate(), 'UTC').setHours(12));
    date = dayjs(date).set('day', dayjs(start).day());

    while (date.isBefore(end)) {
      days.push({ label: date.format('ddd'), date });
      date = date.add(1, 'day');
    }

    return days;
  }

  getToday(): Day {
    return {
      label: dayjs().format('ddd'),
      date: dayjs(),
    };
  }

  getWeekStartsOn(): DayDateFns {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;

    const weekStart = getWeekStartByLocale(locale);
    return weekStart;
  }

  getWeekEndsOn(): DayDateFns {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;

    const weekStart = getWeekStartByLocale(locale);
    return weekStart === 0 ? 6 : ((weekStart - 1) as DayDateFns); // If week starts on Sunday, end on Saturday, otherwise end on the day before the start
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
  weeks(startDate: Date | undefined, endDate: Date | undefined): Week[][] {
    if (!startDate || !endDate) return [];

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
}
