import { Injectable } from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';

import { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import { Training } from '@src/training/entity/training.entity';
import { PrescribedTrainingStats } from '@src/training/entity/training-stats.entity';
import { SetReport } from '@src/training/type/training-set.type';

import { REP_TEMPO_TIME_IN_S } from '../constant/training-limits.constant';
import { Workload } from '../entity/workload.entity';
import { TrainingStatus } from '../enum/training-status.enum';
import { TrainingStats } from '../type/training-stats.type';

@Injectable()
export class TrainingReportService {
  getReportByUser(
    userId: string,
    training: Training,
    workloads: Workload[],
  ): TrainingStats {
    const stats = this.getTrainingStats(training);
    const from = new Date(workloads[0]?.timestamp) || new Date();
    const to = new Date(workloads[workloads.length - 1]?.timestamp) || from;

    const components = new Set(workloads.map((w) => w.componentId));
    const exercises = new Set(workloads.map((w) => w.exerciseId));
    const report = {
      status: TrainingStatus.IN_PROGRESS,
      trainingId: training.id,
      institutionId: training.institutionId,
      groupId: training.groupId,
      cycleId: training.cycleId,
      prescribed: stats,
      userId,
      from,
      to,
      duration: differenceInMinutes(to, from),
      components: components.size,
      supersets: training.components.reduce(
        (sum, c) => sum + c.supersets.length,
        0,
      ),
      exercises: exercises.size,
      sets: this.getNumberOfSets(workloads),
      reps: 0,
      recTime: 0,
      tut: 0,
      tonnage: 0,
      dist: 0,
      recDist: 0,
      time: 0,
      realization: 0,
    };

    for (const workload of workloads) {
      const prescribed = workload.prescribed;
      const completed = workload;
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
      const repsRDiv = this.div('repsR', prescribed, completed);
      const distDiv = this.div('dist', prescribed, completed);
      const distRDiv = this.div('distR', prescribed, completed);
      const timeDiv = this.div('time', prescribed, completed);
      const timeRDiv = this.div('timeR', prescribed, completed);
      const loadDiv = this.div('loadKg', prescribed, completed);
      const loadRDiv = this.div('loadKgR', prescribed, completed);
      const recTimeDiv = this.div('recTime', prescribed, completed); // less is better
      const recTimeRDiv = this.div('recTimeR', prescribed, completed);
      const recDistDiv = this.div('recDist', prescribed, completed);
      const recDistRDiv = this.div('recDistR', prescribed, completed);

      const tempoDiv =
        this.getTempoTime(prescribed) > 0
          ? this.getTempoTime(completed) / this.getTempoTime(prescribed)
          : 0;

      const tempoRDiv =
        this.getTempoRTime(prescribed) > 0
          ? this.getTempoRTime(completed) / this.getTempoRTime(prescribed)
          : 0;

      const int = prescribed.loadKg ? loadDiv : 0;
      const intR = prescribed.loadKgR ? loadRDiv : 0;

      const vol = prescribed.reps
        ? repsDiv
        : prescribed.time
          ? timeDiv
          : prescribed.dist
            ? distDiv
            : 0;

      const volR = prescribed.repsR
        ? repsRDiv
        : prescribed.timeR
          ? timeRDiv
          : prescribed.distR
            ? distRDiv
            : 0;

      const rec = prescribed.recTime
        ? 1 / recTimeDiv
        : prescribed.recDist
          ? recDistDiv
          : 0;

      const recR = prescribed.recTimeR
        ? 1 / recTimeRDiv
        : prescribed.recDistR
          ? recDistRDiv
          : 0;

      const w = // weight for averaging
        1 /
        [vol, volR, int, intR, tempoDiv, tempoRDiv, rec, recR]
          .map((w) => w > 0)
          .filter(Boolean).length;

      report.realization +=
        (1 / stats.sets) *
        (w * vol +
          w * volR +
          w * int +
          w * intR +
          w * tempoDiv +
          w * tempoRDiv +
          w * rec +
          w * recR);
    }

    return report;
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
    if (!prescribed[field]) return 1;
    return prescribed[field] > 0 ? completed[field] / prescribed[field] : 1;
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

  private getTempoTime(set: ExerciseSet): number {
    return (
      (set.tempoEcc || 0) +
      (set.tempoIso || 0) +
      (set.tempoCon || 0) +
      (set.tempoIdle || 0)
    );
  }

  private getTempoRTime(set: ExerciseSet): number {
    return (
      (set.tempoEccR || 0) +
      (set.tempoIsoR || 0) +
      (set.tempoConR || 0) +
      (set.tempoIdleR || 0)
    );
  }

  private getNumberOfSets(workloads: Workload[]): number {
    // only count a set if it has any of the following params more than 0:
    //   - reps
    //   - time
    //   - dist

    return workloads.reduce((count, workload) => {
      if (workload.reps > 0 || workload.time > 0 || workload.dist > 0)
        count += 1;
      return count;
    }, 0);
  }
}
