export class NumberUtil {
  /**
   * Converts value to percent between min and max. For example,
   * percent(50, { min: 0, max: 100 }) returns 0.5.
   */
  percent(value: number, limit = { min: 0, max: 100 }): number {
    return (value - limit.min) / (limit.max - limit.min);
  }

  /**
   * Calculates the 1RM (one-rep max) based on the weight and reps.
   * It returns the estimated 1RM.
   */
  rm(data: { reps: number; weight: number }[]): number {
    // formula from https://en.wikipedia.org/wiki/One-repetition_maximum
    const maxWeight = Math.max(...data.map(({ weight }) => weight));
    return maxWeight / (1.0278 - 0.0278 * (data?.[0]?.reps || 1));
  }
}
