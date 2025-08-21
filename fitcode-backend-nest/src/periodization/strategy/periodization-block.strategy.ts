import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import type {
  PeriodizationContext,
  PeriodizationResult,
} from './periodization.strategy';
import { PeriodizationStrategy } from './periodization.strategy';

export class BlockPeriodizationStrategy extends PeriodizationStrategy {
  type = PeriodizationType.BLOCK;

  progress(context: PeriodizationContext): PeriodizationResult {
    const { baseIntensity, weekIndex, weeksLength } = context;
    const portion = (1.0 * (weekIndex + 1)) / (1.0 * weeksLength);

    let intensityMultiplier: number;
    let volume: number;

    switch (true) {
      case portion <= 0.4:
        intensityMultiplier = 0.65;
        volume = 8;
        break;
      case portion <= 0.7:
        intensityMultiplier = 0.8;
        volume = 5;
        break;
      default:
        intensityMultiplier = 0.9;
        volume = 3;
        break;
    }

    const intensity = this.roundIntensity(
      baseIntensity * intensityMultiplier,
      baseIntensity,
    );

    return { intensity, volume };
  }

  protected override isBaseTraining(_ctx: PeriodizationContext) {
    return false;
  }
}
