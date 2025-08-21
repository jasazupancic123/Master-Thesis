import type { PeriodizationType } from '@src/training/enum/periodization-type.enum';

export interface PeriodizationResult {
  intensity: number;
  volume: number;
}

export interface PeriodizationContext {
  weekIndex: number; // Which week in the plan (0-based)
  dayIndex: number; // Which training day in that week (0-based)
  weeksLength: number; // Total number of weeks in cycle

  baseIntensity: number; // Starting intensity (%1RM, kg, etc.)
  baseVolume: number; // Starting volume (reps/sets)

  prevIntensity?: number; // Last prescribed intensity
  prevVolume?: number; // Last prescribed volume

  readinessFactor: number; // Adjustment factor (0.9–1.1, fatigue/readiness)
}

export abstract class PeriodizationStrategy {
  abstract type: PeriodizationType;

  protected abstract progress(ctx: PeriodizationContext): PeriodizationResult;

  periodize(ctx: PeriodizationContext): PeriodizationResult {
    if (this.isBaseTraining(ctx))
      return { intensity: ctx.baseIntensity, volume: ctx.baseVolume };

    return this.progress(ctx);
  }

  protected isBaseTraining(ctx: PeriodizationContext): boolean {
    return (
      (ctx.weekIndex === 0 && ctx.dayIndex === 0) ||
      ctx.prevIntensity === undefined ||
      ctx.prevVolume === undefined
    );
  }

  /**
   * Rounds the intensity based on the user's baseline.
   * If baseline is < 20 kg or intensity is <= 10 kg, rounds to nearest integer (1 kg steps).
   * If intensity is above 10 kg, rounds to nearest even number (2 kg steps).
   */
  protected roundIntensity(int: number, baseline: number) {
    if (baseline < 20 || int <= 10) return Math.round(int); // 1 kg steps
    const evenApprox = Math.round(int / 2) * 2; // multiple of 2
    return evenApprox < 12 ? 12 : evenApprox;
  }
}
