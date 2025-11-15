import { Injectable } from '@nestjs/common';

import { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import { Training } from '@src/training/entity/training.entity';
import {
  BaseAggregatedReport,
  SetReport,
} from '@src/training/type/training-set.type';

import { REP_TEMPO_TIME_IN_S } from '../constant/training-limits.constant';
import { TrainingComponent } from '../entity/training-component.entity';
import { Workload } from '../entity/workload.entity';
import {
  PrescribedTrainingComponentStats,
  PrescribedTrainingStats,
  TrainingComponentReport,
  TrainingReport,
} from '../type/training-report.type';

@Injectable()
export class TrainingReportService {
  getTrainingReportByUser(
    userId: string,
    training: Training,
    workloads: Workload[], // for the whole training
  ): TrainingReport {
    const prescribed = this.getPrescribedTrainingStats(training);
    const from = new Date(workloads[0]?.timestamp) || new Date();
    const to = new Date(workloads[workloads.length - 1]?.timestamp) || from;

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

  getPrescribedTrainingStats(training: Training): PrescribedTrainingStats {
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
      const componentStats =
        this.getPrescribedTrainingComponentStats(component);

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

    for (const superset of component.supersets)
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

    const vol = p.reps ? repsDiv : p.time ? timeDiv : p.dist ? distDiv : 0;
    const volR = p.repsR
      ? repsRDiv
      : p.timeR
        ? timeRDiv
        : p.distR
          ? distRDiv
          : 0;

    const rec = p.recTime ? 1 / recTimeDiv : p.recDist ? recDistDiv : 0;
    const recR = p.recTimeR ? 1 / recTimeRDiv : p.recDistR ? recDistRDiv : 0;

    const w = // weight for averaging
      1 /
      [vol, volR, int, intR, tempoDiv, tempoRDiv, rec, recR]
        .map((w) => w > 0)
        .filter(Boolean).length;

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
      realization:
        w * vol +
        w * volR +
        w * int +
        w * intR +
        w * tempoDiv +
        w * tempoRDiv +
        w * rec +
        w * recR,
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
}
