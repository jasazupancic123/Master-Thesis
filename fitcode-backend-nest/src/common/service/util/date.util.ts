import { isAfter, isBefore, isEqual, setHours, setMinutes } from 'date-fns';

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

  getIsoWeek(date: Date): number {
    const target = new Date(date.valueOf());

    // Set to nearest Thursday: ISO week starts on Monday, week 1 is the week with the first Thursday
    const day = target.getUTCDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6
    const diff = day === 0 ? -3 : 4 - day; // Move to Thursday
    target.setUTCDate(target.getUTCDate() + diff);

    // Get first day of the year
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const daysDiff = Math.floor(
      (target.getTime() - yearStart.getTime()) / 86400000,
    );

    // Calculate ISO week number
    return Math.floor(daysDiff / 7) + 1;
  }

  doRangesOverlap(
    range1Start: Date,
    range1End: Date,
    range2Start: Date,
    range2End: Date,
  ): boolean {
    return isBefore(range1Start, range2End) && isAfter(range1End, range2Start);
  }
}

export function getTime(date: Date, hours: number, minutes = 0) {
  return setMinutes(setHours(date, hours), minutes);
}
