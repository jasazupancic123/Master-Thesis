import { Injectable } from '@nestjs/common';
import { Week } from '../../cycle/entity/cycle.entity';
import dayjs from 'dayjs';
import { PaginateOptions } from '../type/paginate.type';

@Injectable()
export class CommonService {
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++)
      color += letters[Math.floor(Math.random() * 16)];

    return color;
  }

  /**
   * Converts value to percent between min and max. For example,
   * procentFromValue(50, { min: 0, max: 100 }) returns 0.5.
   */
  percentFromValue(value: number, limit = { min: 0, max: 100 }): number {
    return (value - limit.min) / (limit.max - limit.min);
  }

  /**
   * Calculates the 1RM (one-rep max) based on the weight and reps.
   * It returns the estimated 1RM.
   */
  calculateRM(data: { reps: number; weight: number }[]): number {
    // formula from https://en.wikipedia.org/wiki/One-repetition_maximum
    const maxWeight = Math.max(...data.map(({ weight }) => weight));
    return maxWeight / (1.0278 - 0.0278 * (data?.[0]?.reps || 1));
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
  getWeeksBetween(startDate: Date, endDate: Date): Week[][] {
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

  uniquify<T>(array: T[], key: keyof T): T[] {
    const map = new Map();
    array.forEach(item => map.set(item[key], item));
    return Array.from(map.values());
  }

  paginate<T>(data: T[], options: PaginateOptions<T> = {}): T[] {
    const { page, pageSize } = options;
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return data.slice(start, end);
  }
}