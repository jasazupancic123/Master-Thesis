import { Injectable } from '@nestjs/common';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { WellnessRef } from '@src/common/type/firestore.type';

import { WellnessZScore } from '../entity/wellnes-z-score.entity';
import { Wellness } from '../entity/wellness.entity';
import { ProfileRepository } from '../repository/profile.repository';
import { WellnessRepository } from '../repository/wellness.repository';

@Injectable()
export class WellnessService {
  constructor(
    private readonly repository: WellnessRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  @LogMethod()
  async upsert(ref: WellnessRef, input: Wellness): Promise<void> {
    await this.repository.save(input, ref);

    // calculate Z-scores for wellness
    const history = await this.repository.getLastNByUser(ref, 10);
    const wellness = this.calculateZScore(input, history);
    await this.profileRepository.update(ref.uid, { wellness });
  }

  private calculateZScore(
    wellness: Wellness,
    history: Wellness[],
  ): WellnessZScore {
    const stats = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

      const std = Math.sqrt(variance);
      return { mean: isNaN(mean) ? 0 : mean, std: isNaN(std) ? 0 : std };
    };

    const sleepValues = history
      .map((w) => w.sleep)
      .filter((v): v is number => v !== undefined);
    const fatigueValues = history
      .map((w) => w.fatigue)
      .filter((v): v is number => v !== undefined);
    const sorenessValues = history
      .map((w) => w.soreness)
      .filter((v): v is number => v !== undefined);

    const sleepStats = stats(sleepValues);
    const fatigueStats = stats(fatigueValues);
    const sorenessStats = stats(sorenessValues);

    const zScoreSleep =
      sleepStats.std === 0
        ? 0
        : (wellness.sleep! - sleepStats.mean) / sleepStats.std;

    const zScoreFatigue =
      fatigueStats.std === 0
        ? 0
        : (wellness.fatigue! - fatigueStats.mean) / fatigueStats.std;

    const zScoreSoreness =
      sorenessStats.std === 0
        ? 0
        : (wellness.soreness! - sorenessStats.mean) / sorenessStats.std;

    return { ...wellness, zScoreSleep, zScoreFatigue, zScoreSoreness };
  }
}
