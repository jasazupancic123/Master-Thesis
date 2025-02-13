import dayjs, { Dayjs } from 'dayjs';

export type Day = {
  label: string;
  date: Dayjs;
};

export class DateUtil {
  format(date: Dayjs | Date, options = { withYear: true }): string {
    return dayjs(date).format(`DD. MM.${options.withYear ? ' YYYY' : ''}`);
  }

  formatTime(date: Dayjs | Date): string {
    return dayjs(date).format('HH:mm');
  }

  isBetween(date: Dayjs, startDate: Dayjs, endDate: Dayjs): boolean {
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
    // start from monday
    let start = day.startOf('week').add(1, 'day');
    let end = day.endOf('week').add(1, 'day');

    // if today is sunday, subtract 6 days
    if (day.day() === 0) {
      start = start.subtract(7, 'day');
      end = end.subtract(7, 'day');
    }

    const days: Day[] = [];
    let date = start;
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
}
