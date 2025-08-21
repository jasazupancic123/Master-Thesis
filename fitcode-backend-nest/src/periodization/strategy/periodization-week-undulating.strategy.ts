import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import type {
  PeriodizationContext,
  PeriodizationResult,
} from './periodization.strategy';
import { PeriodizationStrategy } from './periodization.strategy';

export class WeekUndulatingPeriodizationStrategy extends PeriodizationStrategy {
  type = PeriodizationType.WEEK_UNDULATING;

  progress(context: PeriodizationContext): PeriodizationResult {
    const { baseIntensity, baseVolume, weekIndex } = context;

    const isEven = weekIndex % 2 === 0;
    const delta = 0.05 * weekIndex;

    const volume = Math.round(baseVolume * (isEven ? 1 + delta : 1 - delta));
    const intensity = this.roundIntensity(
      baseIntensity * (isEven ? 1 - delta : 1 + delta),
      baseIntensity,
    );

    return { intensity, volume };
  }

  protected override isBaseTraining(ctx: PeriodizationContext) {
    return ctx.weekIndex === 0;
  }
}
