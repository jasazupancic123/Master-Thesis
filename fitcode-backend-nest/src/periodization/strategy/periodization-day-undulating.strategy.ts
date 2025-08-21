import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import type {
  PeriodizationContext,
  PeriodizationResult,
} from './periodization.strategy';
import { PeriodizationStrategy } from './periodization.strategy';

export class DayUndulatingPeriodizationStrategy extends PeriodizationStrategy {
  type = PeriodizationType.DAY_UNDULATING;

  progress(context: PeriodizationContext): PeriodizationResult {
    const { baseIntensity, baseVolume, dayIndex } = context;

    const isEven = dayIndex % 2 === 0;
    const delta = 0.05 * dayIndex;

    const volume = Math.round(baseVolume * (isEven ? 1 + delta : 1 - delta));
    const intensity = this.roundIntensity(
      baseIntensity * (isEven ? 1 - delta : 1 + delta),
      baseIntensity,
    );

    return { intensity, volume };
  }
}
