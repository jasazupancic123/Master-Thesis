import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { endOfDay, subDays } from 'date-fns';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { User } from '@src/common/type/firebase-auth.type';
import { GroupRef } from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { GroupService } from '@src/institution/service/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import { Training } from '@src/training/entity/training.entity';
import {
  BaseAggregatedReport,
  SetReport,
} from '@src/training/type/training-set.type';

import { REP_TEMPO_TIME_IN_S } from '../constant/training-limits.constant';
import { TrainingComponent } from '../entity/training-component.entity';
import { Workload } from '../entity/workload.entity';
import { TrainingComponentUserStatusRepository } from '../repository/training-component-user-status.repository';
import {
  GroupTrainingReportItem,
  PrescribedTrainingComponentStats,
  PrescribedTrainingStats,
  TrainingComponentReport,
  TrainingReport,
  UserTrainingRealizationReportItem,
} from '../type/training-report.type';
import { TrainingService } from './training.service';
import { WorkloadService } from './workload.service';

@Injectable()
export class TrainingReportService {
  constructor(
    private readonly firebase: FirebaseService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: Wrapper<TrainingService>,
    private readonly trainingComponentUserStatusRepository: TrainingComponentUserStatusRepository,
    private readonly institutionService: InstitutionService,
    private readonly groupService: GroupService,
    private readonly workloadService: WorkloadService,
  ) {}

  async findReportsByUser(
    user: User,
    institutionId: string,
  ): Promise<TrainingReport[]> {
    // find workloads for last 10 trainings of the user and calculate reports
    const trainings = await this.trainingService.findAll(
      user,
      institutionId,
      { from: subDays(new Date(), 7), to: endOfDay(new Date()) },
      { limit: 100 },
    );

    const workloads = await this.workloadService.findAllByUserTrainingIds(
      user.uid,
      trainings.map((t) => t.id),
    );

    const reports: TrainingReport[] = [];
    for (const training of trainings) {
      const filtered = workloads.filter(
        (w) => w.trainingId === training.id && w.userId === user.uid,
      );

      if (!filtered.length) continue;

      reports.push(this.getTrainingReportByUser(user.uid, training, filtered));
    }

    return reports;
  }

  @LogMethod()
  async getGroupAttendanceReport(
    user: User,
    ref: GroupRef,
    componentId?: string,
  ): Promise<Record<string, GroupTrainingReportItem>> {
    const group = await this.groupService.findOneByIdOrFail(user, ref);
    return await this.trainingComponentUserStatusRepository.getGroupReport(
      group.id,
      componentId,
    );
  }

  @LogMethod()
  async getTrainingsRealizationReportByUser(
    user: User,
    institutionId: string,
    uid: string, // athlete uid
    componentId?: string,
  ): Promise<UserTrainingRealizationReportItem[]> {
    const institution = await this.institutionService.findByIdOrFail(
      user,
      institutionId,
    );

    const athlete = await this.trainingService.getAthlete(
      user,
      uid,
      institution,
    );

    return await this.trainingComponentUserStatusRepository.getUserTrainingsRealizationReport(
      institutionId,
      athlete.uid,
      componentId,
    );
  }

  @LogMethod()
  async getExerciseWorkloadsByManyUsers(
    user: User,
    institutionId: string,
    exerciseId: string,
    userIds: string[],
  ): Promise<Workload[]> {
    const institution = await this.institutionService.findByIdOrFail(
      user,
      institutionId,
    );

    // check that all users belong to institution
    const athletes = await Promise.all(
      userIds.map((uid) =>
        this.trainingService.getAthlete(user, uid, institution),
      ),
    );

    return await this.workloadService.getExerciseReportByUsers({
      userIds: athletes.map((a) => a.uid),
      exerciseId,
    });
  }

  @LogMethod()
  async getTrainingWorkloads(
    user: User,
    trainingId: string,
  ): Promise<Workload[]> {
    const training = await this.trainingService.findOneByIdOrFail(user, {
      trainingId,
    });

    return this.firebase.isAthlete(user)
      ? await this.workloadService.getAllByTrainingByUser({
          trainingId: training.id,
          userId: user.uid,
        })
      : await this.workloadService.getAllByTraining(training.id);
  }

  getTrainingReportByUser(
    userId: string,
    training: Training,
    workloads: Workload[], // for the whole training
  ): TrainingReport {
    workloads = workloads.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const from = workloads[0]?.timestamp
      ? new Date(workloads[0]?.timestamp)
      : new Date();
    const to = workloads[workloads.length - 1]?.timestamp
      ? new Date(workloads[workloads.length - 1]?.timestamp)
      : from;

    // filter out warmup and cooldown
    workloads = workloads.filter(
      (w) => w.componentId !== 'warmup' && w.componentId !== 'cooldown',
    );

    const prescribed = this.getPrescribedTrainingStats(training, {
      excludeWarmupCooldown: true,
    });

    const components = new Set(workloads.map((w) => w.componentId));
    const exercises = new Set(workloads.map((w) => w.exerciseId));
    const report: TrainingReport = {
      institutionId: training.institutionId,
      groupId: training.groupId,
      cycleId: training.cycleId,
      trainingId: training.id,
      userId,
      from,
      to,
      prescribed,
      components: components.size,
      exercises: exercises.size,
      sets: 0,
      reps: 0,
      dist: 0,
      time: 0,
      recTime: 0,
      recDist: 0,
      tut: 0,
      tonnage: 0,
      realization: 0,
    };

    for (const workload of workloads) {
      const w = this.getWorkloadReport(workload);
      report.sets += w.sets;
      report.reps += w.reps;
      report.tonnage += w.tonnage;
      report.tut += w.tut;
      report.time += w.time;
      report.dist += w.dist;
      report.recTime += w.recTime;
      report.recDist += w.recDist;
      report.realization += w.realization / prescribed.sets;
    }

    return report;
  }

  getTrainingComponentReport(
    userId: string,
    componentId: string,
    training: Training,
    workloads: Workload[],
  ): TrainingComponentReport {
    const prescribed = this.getPrescribedTrainingComponentStats(
      training.components.find((c) => c.id === componentId),
    );

    workloads = workloads
      .filter((w) => w.componentId === prescribed.componentId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const from = new Date(workloads[0]?.timestamp) || new Date();
    const to = new Date(workloads[workloads.length - 1]?.timestamp) || from;
    const report: TrainingComponentReport = {
      institutionId: workloads[0]?.institutionId,
      groupId: workloads[0]?.groupId,
      cycleId: workloads[0]?.cycleId,
      trainingId: workloads[0]?.trainingId,
      componentId: prescribed.componentId,
      userId,
      from,
      to,
      prescribed,
      realization: 0,
      exercises: 0,
      sets: 0,
      reps: 0,
      recTime: 0,
      tut: 0,
      tonnage: 0,
      dist: 0,
      recDist: 0,
      time: 0,
    };

    for (const workload of workloads) {
      const w = this.getWorkloadReport(workload);
      report.exercises += w.exercises;
      report.sets += w.sets;
      report.reps += w.reps;
      report.tonnage += w.tonnage;
      report.tut += w.tut;
      report.time += w.time;
      report.dist += w.dist;
      report.recTime += w.recTime;
      report.recDist += w.recDist;
      report.realization += w.realization / prescribed.sets;
    }

    return report;
  }

  getPrescribedTrainingStats(
    training: Training,
    options?: { excludeWarmupCooldown?: boolean },
  ): PrescribedTrainingStats {
    const stats: PrescribedTrainingStats = {
      realization: 100,
      components: 0,
      exercises: 0,
      sets: 0,
      reps: 0,
      tonnage: 0,
      tut: 0,
      time: 0,
      dist: 0,
      recTime: 0,
      recDist: 0,
    };

    for (const component of training.components) {
      const componentStats = this.getPrescribedTrainingComponentStats(
        component,
        options,
      );

      stats.components += 1;
      stats.exercises += componentStats.exercises;
      stats.sets += componentStats.sets;
      stats.reps += componentStats.reps;
      stats.tonnage += componentStats.tonnage;
      stats.tut += componentStats.tut;
      stats.time += componentStats.time;
      stats.dist += componentStats.dist;
      stats.recTime += componentStats.recTime;
      stats.recDist += componentStats.recDist;
    }

    return stats;
  }

  getPrescribedTrainingComponentStats(
    component: TrainingComponent,
    options?: { excludeWarmupCooldown?: boolean },
  ): PrescribedTrainingComponentStats {
    const stats: PrescribedTrainingComponentStats = {
      realization: 100,
      componentId: component.id,
      exercises: 0,
      sets: 0,
      reps: 0,
      tonnage: 0,
      tut: 0,
      time: 0,
      dist: 0,
      recTime: 0,
      recDist: 0,
    };

    for (const superset of component.supersets) {
      if (
        options?.excludeWarmupCooldown &&
        (superset.warmup || superset.cooldown)
      )
        continue;

      for (const exercise of superset.exercises) {
        stats.exercises += 1;

        for (const set of exercise.sets) {
          const setReport = this.getSetReport(set);

          stats.sets += 1;
          if (setReport.reps) stats.reps += setReport.reps;
          if (setReport.tut) stats.tut += setReport.tut;
          if (setReport.tonnage) stats.tonnage += setReport.tonnage;
          if (setReport.time) stats.time += setReport.time;
          if (setReport.dist) stats.dist += setReport.dist;
          if (setReport.recTime) stats.recTime += setReport.recTime;
          if (setReport.recDist) stats.recDist += setReport.recDist;
        }
      }
    }

    return stats;
  }

  private div(
    field: keyof ExerciseSet,
    prescribed: ExerciseSet,
    completed: ExerciseSet,
  ): number {
    const pv = prescribed[field] ?? 0;
    const cv = completed[field] ?? 0;

    if (pv <= 0) return 0;
    return cv / pv;
  }

  private getSetReport(set: ExerciseSet): SetReport {
    const tonnageL = set.reps && set.loadKg ? set.reps * set.loadKg : 0;
    const tonnageR = set.repsR && set.loadKgR ? set.repsR * set.loadKgR : 0;

    let tutL = set.reps
      ? set.reps * (this.getTempoTime(set) || REP_TEMPO_TIME_IN_S)
      : 0;

    if (set.time > 0) tutL = set.time; // override if time based work is specified

    let tutR = set.repsR
      ? set.repsR * (this.getTempoRTime(set) || REP_TEMPO_TIME_IN_S)
      : 0;

    if (set.time > 0) tutR = set.time;

    return {
      reps:
        set.reps && set.repsR
          ? set.reps + set.repsR
          : set.reps
            ? set.reps
            : set.repsR
              ? set.repsR
              : 0,
      load:
        set.loadKg && set.loadKgR
          ? set.loadKg + set.loadKgR
          : set.loadKg
            ? set.loadKg
            : set.loadKgR
              ? set.loadKgR
              : 0,
      tonnage: tonnageL + tonnageR,
      tut: tutL + tutR,
      time: (set.time || 0) + (set.timeR || 0),
      dist: (set.dist || 0) + (set.distR || 0),
      recTime: (set.recTime || 0) + (set.recTimeR || 0),
      recDist: (set.recDist || 0) + (set.recDistR || 0),
    };
  }

  private getWorkloadReport(workload: Workload): BaseAggregatedReport {
    const p = workload.prescribed; // prescribed
    const c = workload; // completed

    /* Example for realization: prescribed 3 sets * 10 reps * 100 kg * 201 tempo * 60 s rec, 
        completed 1 set of 9 reps * 100 kg * 101 tempo * 100 s rec, this means 1/3 * (9/10*1/4) *
        (100/100*1/4) * (2/3*1/4) * (60/100*1/4), note that recovery is reversed, more is worse */

    // volume
    const repsDiv = this.div('reps', p, c);
    const repsRDiv = this.div('repsR', p, c);
    const distDiv = this.div('dist', p, c);
    const distRDiv = this.div('distR', p, c);
    const timeDiv = this.div('time', p, c);
    const timeRDiv = this.div('timeR', p, c);
    const loadDiv = this.div('loadKg', p, c);
    const loadRDiv = this.div('loadKgR', p, c);
    const recTimeDiv = this.div('recTime', p, c); // less is better
    const recTimeRDiv = this.div('recTimeR', p, c);
    const recDistDiv = this.div('recDist', p, c);
    const recDistRDiv = this.div('recDistR', p, c);

    const tempoDiv =
      this.getTempoTime(p) > 0
        ? this.getTempoTime(c) / this.getTempoTime(p)
        : 0;

    const tempoRDiv =
      this.getTempoRTime(p) > 0
        ? this.getTempoRTime(c) / this.getTempoRTime(p)
        : 0;

    const int = p.loadKg ? loadDiv : 0;
    const intR = p.loadKgR ? loadRDiv : 0;

    function isNum(value: any): value is number {
      return typeof value === 'number' && !isNaN(value);
    }

    const vol = isNum(p.reps)
      ? repsDiv
      : isNum(p.time)
        ? timeDiv
        : isNum(p.dist)
          ? distDiv
          : 0;

    const volR = isNum(p.repsR)
      ? repsRDiv
      : isNum(p.timeR)
        ? timeRDiv
        : isNum(p.distR)
          ? distRDiv
          : 0;

    const rec =
      isNum(p.recTime) && recTimeDiv > 0
        ? 1 / recTimeDiv
        : isNum(p.recDist) && recDistDiv > 0
          ? recDistDiv
          : 0;

    const recR =
      isNum(p.recTimeR) && recTimeRDiv > 0
        ? 1 / recTimeRDiv
        : isNum(p.recDistR) && recDistRDiv > 0
          ? recDistRDiv
          : 0;

    // calculate realization
    const prescriptions = [
      vol,
      volR,
      int,
      intR,
      tempoDiv,
      tempoRDiv,
      rec,
      recR,
    ];

    // weight for averaging
    const safe = prescriptions.map((v) => (Number.isFinite(v) ? v : 0));
    const count = safe.filter((w) => w > 0).length;
    const w = count > 0 ? 1 / count : 0;

    /* let realizationLog = '';
    for (let i = 0, len = safe.length; i < len; i++) {
      if (safe[i] > 0)
        realizationLog += `${i === 0 ? '' : ' +'} ${w} * ${safe[i].toFixed(2)}`;
    }

    console.log(`
      L: vol=${vol} int=${int} tempo=${tempoDiv} rec=${rec}
      R: vol=${volR} int=${intR} tempo=${tempoRDiv} rec=${recR}
      count: ${count} weight: ${w}
      realization: ${realizationLog} == ${safe.reduce((sum, v) => sum + w * v, 0)}
    `); */

    const setReport = this.getSetReport(workload);
    return {
      sets: workload.reps > 0 || workload.time > 0 || workload.dist > 0 ? 1 : 0,
      exercises: 0,
      reps: setReport.reps,
      tonnage: setReport.tonnage,
      tut: setReport.tut,
      time: setReport.time,
      dist: setReport.dist,
      recTime: setReport.recTime,
      recDist: setReport.recDist,
      realization: safe.reduce((sum, v) => sum + w * v, 0),
    };
  }

  private getTempoTime(set: ExerciseSet): number {
    if (!set) return 0;
    return (
      (set.tempoEcc ?? 0) +
      (set.tempoIso ?? 0) +
      (set.tempoCon ?? 0) +
      (set.tempoIdle ?? 0)
    );
  }

  private getTempoRTime(set: ExerciseSet): number {
    if (!set) return 0;
    return (
      (set.tempoEccR ?? 0) +
      (set.tempoIsoR ?? 0) +
      (set.tempoConR ?? 0) +
      (set.tempoIdleR ?? 0)
    );
  }
}
