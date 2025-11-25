import { Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { addDays, endOfDay, isSameDay, startOfDay, subDays } from 'date-fns';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { CommonService } from '@src/common/service/common.service';
import { User } from '@src/common/type/firebase-auth.type';
import {
  InstitutionRef,
  UserRef,
  WellnessRef,
} from '@src/common/type/firestore.type';
import { InstitutionService } from '@src/institution/service/institution.service';

import { WellnessZScore } from '../entity/wellnes-z-score.entity';
import { Wellness } from '../entity/wellness.entity';
import { ProfileRepository } from '../repository/profile.repository';
import { WellnessRepository } from '../repository/wellness.repository';

@Injectable()
export class WellnessService {
  constructor(
    private readonly common: CommonService,
    private readonly repository: WellnessRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly institutionService: InstitutionService,
  ) {}

  @LogMethod()
  async upsert(ref: WellnessRef, input: Wellness): Promise<void> {
    await this.repository.save(input, ref);

    if (input.weight || input.height)
      await this.profileRepository.update(ref.uid, {
        ...(input.weight ? { weight: input.weight } : {}),
        ...(input.height ? { height: input.height } : {}),
      });
  }

  async update(ref: WellnessRef, input: Wellness): Promise<void> {
    return await this.repository.update(ref, input);
  }

  async getLatestByUser(ref: UserRef): Promise<Wellness> {
    return await this.repository.getLatestByUser(ref);
  }

  async findAllByInstitution(
    user: User,
    ref: InstitutionRef,
  ): Promise<WellnessZScore[]> {
    const range: DateFilterDto = {
      from: subDays(startOfDay(new Date()), 10), // default to 10 days ago
      to: addDays(endOfDay(new Date()), 1), // default to now
    };

    const institution = await this.institutionService.findByIdOrFail(
      user,
      ref.institutionId,
    );

    if (
      !this.institutionService.canView(user, institution) ||
      institution.athleteIds.includes(user.uid) // only managers and trainers can view wellnesses
    )
      throw new UnauthorizedException();

    let wellnesses: Wellness[] = [];
    await this.common.generic.measure(
      'WellnessService.findAllByInstitution',
      async () => {
        wellnesses = await this.repository.findAllByInstitution(
          institution,
          range,
        );
      },
    );

    if (!wellnesses.length) return [];

    const stats = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);

      return { mean, std };
    };

    const wellnessZScores = wellnesses.map((w) => {
      const userWellnesses = wellnesses.filter(
        (uw) => uw.userId === w.userId && !isSameDay(uw.date, w.date),
      );

      const sleepValues = userWellnesses
        .map((w) => w.sleep)
        .filter((v): v is number => v !== undefined);
      const fatigueValues = userWellnesses
        .map((w) => w.fatigue)
        .filter((v): v is number => v !== undefined);
      const sorenessValues = userWellnesses
        .map((w) => w.soreness)
        .filter((v): v is number => v !== undefined);

      const sleepStats = stats(sleepValues);
      const fatigueStats = stats(fatigueValues);
      const sorenessStats = stats(sorenessValues);

      const zScoreSleep =
        sleepStats.std === 0
          ? 0
          : (w.sleep! - sleepStats.mean) / sleepStats.std;
      const zScoreFatigue =
        fatigueStats.std === 0
          ? 0
          : (w.fatigue! - fatigueStats.mean) / fatigueStats.std;
      const zScoreSoreness =
        sorenessStats.std === 0
          ? 0
          : (w.soreness! - sorenessStats.mean) / sorenessStats.std;

      return plainToInstance(WellnessZScore, {
        ...w,
        zScoreSleep,
        zScoreFatigue,
        zScoreSoreness,
      });
    });

    return wellnessZScores;
  }
}
