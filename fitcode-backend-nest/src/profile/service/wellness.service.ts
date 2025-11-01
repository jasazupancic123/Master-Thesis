import { Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { startOfDay, subDays } from 'date-fns';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { User } from '@src/common/type/firebase-auth.type';
import {
  InstitutionRef,
  UserRef,
  WellnessRef,
} from '@src/common/type/firestore.type';
import { InstitutionService } from '@src/institution/service/institution.service';

import { WellnessZScore } from '../entity/wellnes-z-score.entity';
import { Wellness } from '../entity/wellness.entity';
import { WellnessRepository } from '../repository/wellness.repository';

@Injectable()
export class WellnessService {
  constructor(
    private readonly repository: WellnessRepository,
    private readonly institutionService: InstitutionService,
  ) {}

  @LogMethod()
  async upsert(ref: WellnessRef, input: Wellness): Promise<void> {
    await this.repository.save(input, ref);
  }

  async update(ref: WellnessRef, input: Wellness): Promise<void> {
    return await this.repository.update(ref, input);
  }

  async getLatestByUser(ref: UserRef): Promise<Wellness> {
    return await this.repository.getLatestByUser(ref);
  }

  async getLastBodyweight(ref: UserRef): Promise<number | null> {
    return await this.repository.getLastBodyweight(ref);
  }

  async findAllByInstitution(
    user: User,
    ref: InstitutionRef,
  ): Promise<WellnessZScore[]> {
    const range: DateFilterDto = {
      from: subDays(startOfDay(new Date()), 10), // default to 10 days ago
      to: startOfDay(new Date()), // default to now
    };

    const institution = await this.institutionService.findByIdOrFail(ref);
    if (
      !this.institutionService.canView(user, institution) ||
      institution.athleteIds.includes(user.uid) // only managers and trainers can view wellnesses
    )
      throw new UnauthorizedException();

    const wellnesses = await this.repository.findAllByInstitution(
      institution,
      range,
    );

    if (!wellnesses.length) return [];

    const sleepValues = wellnesses.map((w) => w.sleep ?? 0);
    const fatigueValues = wellnesses.map((w) => w.fatigue ?? 0);
    const sorenessValues = wellnesses.map((w) => w.soreness ?? 0);

    const stats = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);

      return { mean, std };
    };

    const sleepStats = stats(sleepValues);
    const fatigueStats = stats(fatigueValues);
    const sorenessStats = stats(sorenessValues);

    const wellnessZScores = wellnesses.map((w) => {
      const sleepZ = sleepStats.std
        ? (w.sleep! - sleepStats.mean) / sleepStats.std
        : 0;

      const fatigueZ = fatigueStats.std
        ? (w.fatigue! - fatigueStats.mean) / fatigueStats.std
        : 0;

      const sorenessZ = sorenessStats.std
        ? (w.soreness! - sorenessStats.mean) / sorenessStats.std
        : 0;

      return plainToInstance(WellnessZScore, {
        ...w,
        sleepZScore: isFinite(sleepZ) ? sleepZ : 0,
        fatigueZScore: isFinite(fatigueZ) ? fatigueZ : 0,
        sorenessZScore: isFinite(sorenessZ) ? sorenessZ : 0,
      });
    });

    return wellnessZScores;
  }
}
