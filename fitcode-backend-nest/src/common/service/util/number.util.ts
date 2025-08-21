import { RepMaxFormula } from '@src/training/enum/rep-max-formula.enum';

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
   * It returns callback function for n-RM.
   */
  rm(weight: number, reps: number, formula = RepMaxFormula.EPLEY) {
    // formula from https://en.wikipedia.org/wiki/One-repetition_maximum
    if (reps < 1) throw new Error('Reps must be at least 1');

    let oneRM: number;
    switch (formula) {
      case RepMaxFormula.EPLEY:
        oneRM = weight * (1 + reps / 30);
        break;
      case RepMaxFormula.BRZYCKI:
        oneRM = weight / (1.0278 - 0.0278 * reps);
        break;
      case RepMaxFormula.LANDER:
        oneRM = (100 * weight) / (101.3 - 2.67123 * reps);
        break;
    }

    return (n: number) =>
      oneRM /
      (formula === RepMaxFormula.BRZYCKI ? 1.0278 - 0.0278 * n : 1 + n / 30);
  }

  isNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v);
  }

  getStandardDeviation(xs: number[]) {
    const n = xs.length;
    if (n < 2) return NaN; // not enough history
    const mean = xs.reduce((a, b) => a + b, 0) / n;
    const sse = xs.reduce((a, x) => a + (x - mean) ** 2, 0);
    return Math.sqrt(sse / (n - 1));
  }

  getMean(xs: number[]) {
    const n = xs.length;
    if (n === 0) return 0;
    return xs.reduce((a, b) => a + b, 0) / n;
  }

  getZScore(
    current: number | null | undefined,
    mean: number | null,
    sd: number | null,
  ) {
    return this.isNumber(current) &&
      this.isNumber(mean) &&
      this.isNumber(sd) &&
      sd > 0
      ? (current - mean) / sd
      : null;
  }
}
