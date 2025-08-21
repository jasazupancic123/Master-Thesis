import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import type {
  PeriodizationContext,
  PeriodizationResult,
} from './periodization.strategy';
import { PeriodizationStrategy } from './periodization.strategy';

export class AutoregulatoryPeriodizationStrategy extends PeriodizationStrategy {
  type = PeriodizationType.AUTOREGULATORY;

  progress(context: PeriodizationContext): PeriodizationResult {
    const { baseIntensity, prevIntensity, prevVolume, readinessFactor } =
      context;

    const intensity = this.roundIntensity(
      prevIntensity * readinessFactor,
      baseIntensity,
    );

    const reps = Math.round(prevVolume * readinessFactor);
    const volume = Math.max(reps, 3); // Ensure volume does not go below 3

    return { intensity, volume };
  }
}
