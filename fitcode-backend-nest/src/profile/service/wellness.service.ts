import { Injectable, UnauthorizedException } from '@nestjs/common';
import { isBefore, isSameDay, startOfDay, subDays } from 'date-fns';

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
import { WellnessRepository } from '../repository/wellness.repository';

@Injectable()
export class WellnessService {
  constructor(
    private readonly commonService: CommonService,
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

    const dayStart = startOfDay(new Date());

    return wellnesses
      .filter((w) => isSameDay(w.date, dayStart))
      .map((w) => this.zScore(w, wellnesses, dayStart));
  }

  private zScore(
    doc: Wellness,
    docs: Wellness[],
    dayStart: Date,
  ): WellnessZScore | null {
    const history = docs.filter((wd) => isBefore(wd.date, dayStart));

    if (history.length === 0) return doc;

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
      ...doc,
      sleepZScore: this.commonService.number.z(
        doc.sleep,
        means.sleep,
        stds.sleep,
      ),
      fatigueZScore: this.commonService.number.z(
        doc.fatigue,
        means.fatigue,
        stds.fatigue,
      ),
      sorenessZScore: this.commonService.number.z(
        doc.soreness,
        means.soreness,
        stds.soreness,
      ),
    };
  }
}
