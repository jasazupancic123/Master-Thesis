import { Timestamp } from '@google-cloud/firestore';
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { CommonService } from '@src/common/service/common.service';
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
    private readonly commonService: CommonService,
    private readonly repository: WellnessRepository,
    private readonly institutionService: InstitutionService,
  ) {}

  async getDoc(ref: WellnessRef): Promise<Wellness> {
    return await this.repository.findById(ref);
  }

  @LogMethod()
  async upsert(ref: WellnessRef, input: Wellness): Promise<Wellness> {
    const meta = await this.repository.findById(ref);
    if (!meta) await this.repository.save(input, ref);
    else await this.repository.update(ref, input);

    return input;
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

  async getDocsByInstitution(ref: InstitutionRef): Promise<WellnessZScore[]> {
    const institution = await this.institutionService.getDocByIdOrFail(ref);
    const userIds: UserRef[] = institution.athleteIds.map((id) => ({
      uid: id,
    }));

    const now = DateTime.now();
    const startOfToday = now.startOf('day').toJSDate();
    const startOf10DaysBefore = now
      .startOf('day')
      .minus({ days: 10 })
      .startOf('day')
      .toJSDate();

    const wellness = userIds.length
      ? await Promise.all(
          userIds.map(async (userRef) => {
            const wellnessDocs = await this.repository.findAll(
              (q) =>
                q
                  .where('userId', '==', userRef.uid)
                  .where('date', '>=', Timestamp.fromDate(startOf10DaysBefore)),
              { ...userRef, date: null },
            );

            const todayZ = this.zScore(wellnessDocs, startOfToday);

            return [todayZ].filter((z) => z !== null);
          }),
        )
      : [];

    return wellness.flat();
  }

  private zScore(docs: Wellness[], date: Date): WellnessZScore | null {
    const dayStart = DateTime.fromJSDate(date).startOf('day');
    const found = docs.find((wd) =>
      DateTime.fromJSDate(wd.date).hasSame(dayStart, 'day'),
    );

    if (!found) return null;
    if (docs.length < 2) return found;

    const history = docs.filter(
      (wd) => DateTime.fromJSDate(wd.date) < dayStart,
    );

    const hist = {
      sleep: history
        .map((w) => w.sleep)
        .filter(this.commonService.number.isNumber),
      fatigue: history
        .map((w) => w.fatigue)
        .filter(this.commonService.number.isNumber),
      soreness: history
        .map((w) => w.soreness)
        .filter(this.commonService.number.isNumber),
    };

    function mean(history: number[]): number | null {
      if (history.length === 0) return null;
      return this.commonService.number.mean(history);
    }

    const means = {
      sleep: mean.call(this, hist.sleep),
      fatigue: mean.call(this, hist.fatigue),
      soreness: mean.call(this, hist.soreness),
    };

    const stds = {
      sleep: this.commonService.number.std(hist.sleep),
      fatigue: this.commonService.number.std(hist.fatigue),
      soreness: this.commonService.number.std(hist.soreness),
    };

    return {
      ...found,
      sleepZScore: this.commonService.number.z(
        found.sleep,
        means.sleep,
        stds.sleep,
      ),
      fatigueZScore: this.commonService.number.z(
        found.fatigue,
        means.fatigue,
        stds.fatigue,
      ),
      sorenessZScore: this.commonService.number.z(
        found.soreness,
        means.soreness,
        stds.soreness,
      ),
    };
  }
}
