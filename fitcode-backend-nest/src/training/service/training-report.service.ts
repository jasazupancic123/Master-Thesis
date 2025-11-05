import { Injectable, NotFoundException } from '@nestjs/common';
import { compareAsc, differenceInMinutes } from 'date-fns';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { TrainingReportRef } from '@src/common/type/firestore.type';
import { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import { Training } from '@src/training/entity/training.entity';
import { TrainingReport } from '@src/training/entity/training-report.entity';
import { PrescribedTrainingStats } from '@src/training/entity/training-stats.entity';
import { WorkloadService } from '@src/training/service/workload.service';
import {
  DefinedExerciseSet,
  SetReport,
} from '@src/training/type/training-set.type';

import { REP_TEMPO_TIME_IN_S } from '../constant/training-limits.constant';
import { TrainingReportRepository } from '../repository/training-report.repository';

@Injectable()
export class TrainingReportService {
  constructor(
    private readonly repository: TrainingReportRepository,
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
    ).sort((a, b) => compareAsc(new Date(a.timestamp), new Date(b.timestamp)));

    const stats = this.getTrainingStats(training);
    const from = workloads[0]?.timestamp || new Date();
    const to = workloads[workloads.length - 1]?.timestamp || from;

    const components = new Set(workloads.map((w) => w.componentId));
    const exercises = new Set(workloads.map((w) => w.exerciseId));

    const report: TrainingReport = {
      trainingId: training.id,
      institutionId: training.institutionId,
      groupId: training.groupId,
      cycleId: training.cycleId,
      prescribed: stats,
      userId,
      ...ref,
      from,
      to,
      completed: workloads.length >= stats.sets,
      duration: differenceInMinutes(to, from),
      components: components.size,
      supersets: training.components.reduce(
        (sum, c) => sum + c.supersets.length,
        0,
      ),
      exercises: exercises.size,
      sets: workloads.length,
      reps: 0,
      recTime: 0,
      tut: 0,
      tonnage: 0,
      dist: 0,
      recDist: 0,
      time: 0,
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
      report.tut += setReport.tut;
      report.tonnage += setReport.tonnage;
      report.time += setReport.time;
      report.dist += setReport.dist;
      report.recDist += setReport.recDist;

      /* Example for realization: prescribed 3 sets * 10 reps * 100 kg * 201 tempo * 60 s rec, 
        completed 1 set of 9 reps * 100 kg * 101 tempo * 100 s rec, this means 1/3 * (9/10*1/4) *
        (100/100*1/4) * (2/3*1/4) * (60/100*1/4), note that recovery is reversed, more is worse */

      // volume
      const repsDiv = this.div('reps', prescribed, completed);
      const distDiv = this.div('dist', prescribed, completed);
      const timeDiv = this.div('time', prescribed, completed);
      const loadDiv = this.div('loadKg', prescribed, completed);
      const recTimeDiv = this.div('recTime', prescribed, completed); // less is better
      const recDistDiv = this.div('recDist', prescribed, completed);
      const tempoDiv =
        this.getTempoTime(prescribed) > 0
          ? this.getTempoTime(completed) / this.getTempoTime(prescribed)
          : 1;

      const int = prescribed.loadKg ? loadDiv : 0;
      const vol = prescribed.reps
        ? repsDiv
        : prescribed.time
          ? timeDiv
          : prescribed.dist
            ? distDiv
            : 0;

      const rec = prescribed.recTime
        ? recTimeDiv
        : prescribed.recDist
          ? recDistDiv
          : 0;

      if (prescribed.reps > 0) {
        // unilateral exercise
        const repsRDiv = this.div('repsR', prescribed, completed);
        const distRDiv = this.div('distR', prescribed, completed);
        const timeRDiv = this.div('timeR', prescribed, completed);
        const loadRDiv = this.div('loadKgR', prescribed, completed);
        const recTimeRDiv = this.div('recTimeR', prescribed, completed);
        const recDistRDiv = this.div('recDistR', prescribed, completed);
        const tempoRDiv =
          this.getTempoRTime(prescribed) > 0
            ? this.getTempoRTime(completed) / this.getTempoRTime(prescribed)
            : 1;

        const intR = prescribed.loadKgR ? loadRDiv : 0;
        const volR = prescribed.repsR
          ? repsRDiv
          : prescribed.timeR
            ? timeRDiv
            : prescribed.distR
              ? distRDiv
              : 0;

        const recR = prescribed.recTimeR
          ? recTimeRDiv
          : prescribed.recDistR
            ? recDistRDiv
            : 0;

        report.realization +=
          (1 / stats.sets) *
          (0.125 * vol +
            0.125 * volR +
            0.125 * int +
            0.125 * intR +
            0.125 * tempoDiv +
            0.125 * tempoRDiv +
            0.125 * rec +
            0.125 * recR);
      } else
        report.realization +=
          (1 / stats.sets) *
          (0.25 * vol + 0.25 * int + 0.25 * tempoDiv + 0.25 * rec);
    }

    await this.repository.save(ref, report);
  }

  private div(
    field: keyof ExerciseSet,
    prescribed: DefinedExerciseSet,
    completed: DefinedExerciseSet,
  ): number {
    return prescribed[field] > 0 ? completed[field] / prescribed[field] : 1;
  }

  getTrainingStats(training: Training): PrescribedTrainingStats {
    const stats: PrescribedTrainingStats = {
      plannedComponents: training.components.map((c) => ({
        componentId: c.id,
        totalSets: c.supersets.reduce(
          (sum, s) =>
            sum + s.exercises.reduce((s2, e) => s2 + e.sets.length, 0),
          0,
        ),
      })),
      duration: differenceInMinutes(training.to, training.from),
      components: training.components.length,
      supersets: 0,
      exercises: new Set<string>(
        training.components.flatMap((c) =>
          c.supersets.flatMap((s) => s.exercises.map((e) => e.id)),
        ),
      ).size,
      sets: 0,
      reps: 0,
      tonnage: 0,
      tut: 0,
      time: 0,
      dist: 0,
      recTime: 0,
      recDist: 0,
    };

    for (const component of training.components)
      for (const superset of component.supersets) {
        stats.supersets += 1;

        for (const exercise of superset.exercises) {
          const sets = exercise.sets.length;
          stats.sets += sets;

          for (const set of exercise.sets) {
            const setReport = this.getSetReport(set);
            stats.reps += setReport.reps;
            stats.tut += setReport.tut;
            stats.tonnage += setReport.tonnage;
            stats.time += setReport.time;
            stats.dist += setReport.dist;
            stats.recTime += setReport.recTime;
            stats.recDist += setReport.recDist;
          }
        }
      }

    return stats;
  }

  private getSetReport(set: ExerciseSet): SetReport {
    const defined = this.getDefinedSet(set);

    let tut =
      defined.reps *
        (defined.tempoEcc > 0
          ? this.getTempoTime(defined)
          : REP_TEMPO_TIME_IN_S) +
      defined.repsR *
        (defined.tempoEccR > 0
          ? this.getTempoRTime(defined)
          : REP_TEMPO_TIME_IN_S);

    if (defined.time > 0) tut = defined.time; // override if time based work is specified

    return {
      reps: defined.reps + defined.repsR,
      load: defined.loadKg + defined.loadKgR,
      tonnage: defined.reps * defined.loadKg + defined.repsR * defined.loadKgR,
      tut: tut,
      time: defined.time,
      dist: defined.dist,
      recTime: defined.recTime,
      recDist: defined.recDist,
    };
  }

  private getTempoTime(set: DefinedExerciseSet): number {
    return set.tempoEcc + set.tempoIso + set.tempoCon + set.tempoIdle;
  }

  private getTempoRTime(set: DefinedExerciseSet): number {
    return set.tempoEccR + set.tempoIsoR + set.tempoConR + set.tempoIdleR;
  }

  private getDefinedSet(set: ExerciseSet): DefinedExerciseSet {
    return {
      reps: set.reps || 1,
      repsR: set.repsR || 0,
      loadKg: set.loadKg || 0,
      loadKgR: set.loadKgR || 0,
      loadRm: 0,
      loadRmR: 0,
      loadBw: 0,
      loadBwR: 0,
      tempoEcc: set.tempoEcc || 2,
      tempoIso: set.tempoIso || 0,
      tempoCon: set.tempoCon || 1,
      tempoIdle: set.tempoIdle || 0,
      tempoEccR: set.tempoEccR || 0,
      tempoIsoR: set.tempoIsoR || 0,
      tempoConR: set.tempoConR || 0,
      tempoIdleR: set.tempoIdleR || 0,
      vel: set.vel || 0,
      velR: set.velR || 0,
      eff: set.eff || 1,
      effR: set.effR || 0,
      recTime: set.recTime || 0,
      recTimeR: set.recTimeR || 0,
      recDist: set.recDist || 0,
      recDistR: set.recDistR || 0,
      time: set.time || 0,
      timeR: set.timeR || 0,
      dist: set.dist || 0,
      distR: set.distR || 0,
    };
  }
}
