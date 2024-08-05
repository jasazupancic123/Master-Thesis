import { Dayjs } from 'dayjs';

export function isDateBetween(date: Dayjs, startDate: Dayjs, endDate: Dayjs): boolean {
  return date.isSame(startDate, 'day') ||
    date.isSame(endDate, 'day') ||
    (date.isAfter(startDate, 'day') && date.isBefore(endDate, 'day'));
}