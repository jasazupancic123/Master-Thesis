import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import type {
  PeriodizationContext,
  PeriodizationResult,
} from './periodization.strategy';
import { PeriodizationStrategy } from './periodization.strategy';

export class LinearPeriodizationStrategy extends PeriodizationStrategy {
  type = PeriodizationType.LINEAR;

  progress(context: PeriodizationContext): PeriodizationResult {
    const { baseIntensity, prevIntensity, prevVolume } = context;

    const maxWeeklyIncrease = 0.05 * baseIntensity; // Max 5% increase per week
    const maxMonthlyIncrease = 0.2 * baseIntensity; // Max 20% increase per month
    const increase = Math.min(maxWeeklyIncrease, maxMonthlyIncrease / 4);

    const newVolume = Math.max(prevVolume - 1, 3); // Ensure volume doesn't drop below 3
    const newIntensity = isFinite(increase)
      ? this.roundIntensity(prevIntensity + increase, baseIntensity)
      : undefined;

    return { intensity: newIntensity, volume: newVolume };
  }
}
