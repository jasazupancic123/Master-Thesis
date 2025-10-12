import { Injectable, NotFoundException } from '@nestjs/common';
import { compareAsc, differenceInMinutes } from 'date-fns';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { TrainingReportRef } from '@src/common/type/firestore.type';

import {
  DIST_TIME_IN_S,
  REP_TEMPO_TIME_IN_S,
} from '../constant/training-limits.constant';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Training } from '../entity/training.entity';
import { TrainingReport } from '../entity/training-report.entity';
import { TrainingStats } from '../entity/training-stats.entity';
import { TrainingReportRepository } from '../repository/training-report.repository';
import { DefinedExerciseSet, SetReport } from '../type/training-set.type';
import { ExerciseParamService } from './exercise-param.service';
import { WorkloadService } from './workload.service';

@Injectable()
export class TrainingReportService {
  constructor(
    private readonly repository: TrainingReportRepository,
    private readonly exerciseParamService: ExerciseParamService,
    private readonly workloadService: WorkloadService,
  ) {}

  async findAllByUser(
    userId: string,
    filter?: DateFilterDto & { institutionId?: string },
  ): Promise<TrainingReport[]> {
    return await this.repository.getAllByUser(userId, filter);
  }

  async findById(ref: TrainingReportRef): Promise<TrainingReport | null> {
    return await this.repository.findById(ref);
  }

  async findByIdOrFail(ref: TrainingReportRef): Promise<TrainingReport> {
    const report = await this.repository.findById(ref);
    if (!report) throw new NotFoundException('Training report not found');
    return report;
  }

  async updateReport(
    userId: string,
    training: Training,
    input?: { photoURLs?: string[] },
  ): Promise<void> {
    const ref: TrainingReportRef = { trainingId: training.id, userId };
    const workloads = (
      await this.workloadService.findAllByUserTraining(userId, ref)
    ).sort((a, b) => compareAsc(new Date(a.from), new Date(b.from)));

    const stats = this.getTrainingStats(training);
    const from = workloads[0]?.from || new Date();
    const to = workloads[workloads.length - 1]?.to || from;

    const components = new Set(workloads.map((w) => w.componentId));
    const exercises = new Set(workloads.map((w) => w.exerciseId));

    const report: TrainingReport = {
      institutionId: training.institutionId,
      groupId: training.groupId,
      cycleId: training.cycleId,
      userId,
      ...stats,
      ...ref,
      from,
      to,
      completed: workloads.length >= stats.totalSets,
      duration: differenceInMinutes(to, from),
      components: components.size,
      exercises: exercises.size,
      sets: workloads.length,
      reps: 0,
      recTime: 0,
      tit: 0,
      tonnage: 0,
      realization: 0,
      muscleValues: [], // to be calculated
      photoURLs: input?.photoURLs || [],
      componentStatuses: stats.plannedComponents.map((pc) => {
        const completedSets = workloads.filter(
          (w) => w.componentId === pc.componentId,
        ).length;

        return {
          componentId: pc.componentId,
          status:
            completedSets === 0
              ? 'not_started'
              : completedSets < pc.totalSets
                ? 'in_progress'
                : 'completed',
        };
      }),
    };

    for (const workload of workloads) {
      const prescribed = this.getDefinedSet(workload.prescribed);
      const completed = this.getDefinedSet(workload);
      const setReport = this.getSetReport(workload);

      report.reps += setReport.reps;
      report.recTime += setReport.recTime;
      report.tit += setReport.tit;
      report.tonnage += setReport.tonnage;

      if (setReport.time > 0) {
        if (!report.timeVol) report.timeVol = 0;
        report.timeVol += setReport.time;
      }

      if (setReport.dist > 0) {
        if (!report.distVol) report.distVol = 0;
        report.distVol += setReport.dist;
      }

      if (setReport.recDist > 0) {
        if (!report.recDist) report.recDist = 0;
        report.recDist += setReport.recDist;
      }

      /* Example for realization: prescribed 3 sets * 10 reps * 100 kg * 201 tempo * 60 s rec, 
        completed 1 set of 9 reps * 100 kg * 101 tempo * 100 s rec, this means 1/3 * (9/10*1/4) *
        (100/100*1/4) * (2/3*1/4) * (60/100*1/4), note that recovery is reversed, more is worse */

      if (prescribed.reps > 0) {
        // unilateral exercise
        const repsLDiv =
          prescribed.reps > 0 ? completed.reps / prescribed.reps : 1;
        const repsRDiv =
          prescribed.repsR > 0 ? completed.repsR / prescribed.repsR : 1;
        const loadLDiv =
          prescribed.loadKg > 0 ? completed.loadKg / prescribed.loadKg : 1;
        const loadRDiv =
          prescribed.loadKgR > 0 ? completed.loadKgR / prescribed.loadKgR : 1;
        const tempoLDiv =
          prescribed.tempo > 0 ? completed.tempo / prescribed.tempo : 1;
        const tempoRDiv =
          prescribed.tempoR > 0 ? completed.tempoR / prescribed.tempoR : 1;
        const recDiv =
          prescribed.recTime > 0 ? prescribed.recTime / completed.recTime : 1; // less is better

        report.realization +=
          (1 / stats.totalSets) *
          (0.125 * repsLDiv +
            0.125 * repsRDiv +
            0.125 * loadLDiv +
            0.125 * loadRDiv +
            0.125 * tempoLDiv +
            0.125 * tempoRDiv +
            0.25 * recDiv);
      } else {
        const repsDiv =
          prescribed.reps > 0 ? completed.reps / prescribed.reps : 1;
        const loadDiv =
          prescribed.loadKg > 0 ? completed.loadKg / prescribed.loadKg : 1;
        const tempoDiv =
          prescribed.tempo > 0 ? completed.tempo / prescribed.tempo : 1;
        const recDiv =
          prescribed.recTime > 0 ? prescribed.recTime / completed.recTime : 1; // less is better

        report.realization +=
          (1 / stats.totalSets) *
          (0.25 * repsDiv + 0.25 * loadDiv + 0.25 * tempoDiv + 0.25 * recDiv);
      }
    }

    await this.repository.save(ref, report);
  }

  getTrainingStats(training: Training): TrainingStats {
    const stats: TrainingStats = {
      plannedComponents: training.components.map((c) => ({
        componentId: c.id,
        totalSets: c.supersets.reduce(
          (sum, s) =>
            sum + s.exercises.reduce((s2, e) => s2 + e.sets.length, 0),
          0,
        ),
      })),
      totalDuration: differenceInMinutes(training.to, training.from),
      totalComponents: training.components.length,
      totalSupersets: 0,
      totalExercises: new Set<string>(
        training.components.flatMap((c) =>
          c.supersets.flatMap((s) => s.exercises.map((e) => e.id)),
        ),
      ).size,
      totalSets: 0,
      totalReps: 0,
      totalRecTime: 0,
      totalActiveTime: 0,
      totalTonnage: 0,
    };

    for (const component of training.components)
      for (const superset of component.supersets) {
        stats.totalSupersets += 1;

        for (const exercise of superset.exercises) {
          const sets = exercise.sets.length;
          stats.totalSets += sets;

          for (const set of exercise.sets) {
            const setReport = this.getSetReport(set);
            stats.totalReps += setReport.reps;
            stats.totalRecTime += setReport.recTime;
            stats.totalActiveTime += setReport.tit;
            stats.totalTonnage += setReport.tonnage;

            if (setReport.time > 0) {
              if (!stats.totalTimeVol) stats.totalTimeVol = 0;
              stats.totalTimeVol += setReport.time;
            }

            if (setReport.dist > 0) {
              if (!stats.totalDistVol) stats.totalDistVol = 0;
              stats.totalDistVol += setReport.dist;
            }

            if (setReport.recDist > 0) {
              if (!stats.totalRecDist) stats.totalRecDist = 0;
              stats.totalRecDist += setReport.recDist;
            }
          }
        }
      }

    return stats;
  }

  private getSetReport(set: ExerciseSet): SetReport {
    const defined = this.getDefinedSet(set);
    const reps = defined.reps + defined.repsR;
    const load = defined.loadKg + defined.loadKgR;
    const time = defined.time;
    const dist = defined.dist;

    // calculated fields
    const tonnage =
      defined.reps * defined.loadKg + defined.repsR * defined.loadKgR;

    let tit = defined.reps * defined.tempo + defined.repsR * defined.tempoR;
    if (time > 0)
      tit = time; // override if time based work is specified
    else if (dist > 0) tit = dist * (defined.vel || DIST_TIME_IN_S);

    return {
      reps,
      load,
      tonnage,
      tit,
      time,
      dist,
      recTime: defined.recTime,
      recDist: defined.recDist,
    };
  }

  private getDefinedSet(set: ExerciseSet): DefinedExerciseSet {
    const tempo = set.tempo
      ? this.exerciseParamService.tempoToSeconds(set.tempo) ||
        REP_TEMPO_TIME_IN_S
      : 0;

    const tempoR =
      set.tempo && set.tempoR
        ? this.exerciseParamService.tempoToSeconds(set.tempoR) ||
          REP_TEMPO_TIME_IN_S
        : 0;

    return {
      reps: set.reps || 1,
      repsR: set.repsR || 0,
      loadKg: set.loadKg || 0,
      loadKgR: set.loadKgR || 0,
      loadRm: 0,
      loadRmR: 0,
      loadBw: 0,
      loadBwR: 0,
      tempo,
      tempoR,
      vel: set.vel || 0,
      velR: set.velR || 0,
      eff: set.eff || 1,
      recTime: set.recTime || 0,
      recDist: set.recDist || 0,
      time: set.time,
      dist: set.dist,
    };
  }
}
