import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import type {
  PeriodizationContext,
  PeriodizationResult,
} from './periodization.strategy';
import { PeriodizationStrategy } from './periodization.strategy';

export class WavePeriodizationStrategy extends PeriodizationStrategy {
  type = PeriodizationType.WAVE;

  progress(context: PeriodizationContext): PeriodizationResult {
    const { baseIntensity, weekIndex } = context;

    const wavePattern = [0.75, 0.85, 0.8, 0.9];
    const fraction = wavePattern[weekIndex % 4];

    const volume = fraction < 0.85 ? 5 : 3;
    const intensity = this.roundIntensity(
      baseIntensity * fraction,
      baseIntensity,
    );

    return { intensity, volume };
  }

  protected override isBaseTraining(_ctx: PeriodizationContext) {
    return false;
  }
}
