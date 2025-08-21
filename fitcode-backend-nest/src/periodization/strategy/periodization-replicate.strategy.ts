import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import type {
  PeriodizationContext,
  PeriodizationResult,
} from './periodization.strategy';
import { PeriodizationStrategy } from './periodization.strategy';

export class ReplicatePeriodizationStrategy extends PeriodizationStrategy {
  type = PeriodizationType.REPLICATE;

  progress(context: PeriodizationContext): PeriodizationResult {
    const { baseIntensity, baseVolume } = context;
    return { intensity: baseIntensity, volume: baseVolume };
  }

  protected override isBaseTraining(_ctx: PeriodizationContext) {
    return false;
  }
}
