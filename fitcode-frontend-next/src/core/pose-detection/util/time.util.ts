export class TimeUtil {
  static getMsDiff(start: Date, end: Date): number {
    return end.getTime() - start.getTime();
  }

  static getMsValue(date: Date): number {
    return date.getTime();
  }
}
