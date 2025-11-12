import dayjs from 'dayjs';
import { PrescribedTrainingStats, SetReport } from './type/training-stats.type';
import { Training } from './type/training.type';
import { ExerciseSet } from './type/exercise-set.type';
import { TrainingReport } from './type/training-report.type';
import { AuthUser } from '../auth/type/user.type';
import { TrainingStatus } from './enum/training-status.enum';
import { TrainingComponent } from './type/training-component.type';

const REP_TEMPO_TIME_IN_S = 3; // 3 seconds per rep tempo if not specified

export class TrainingReportService {
  static initEmptyTrainingReport(
    training: Training,
    component: TrainingComponent,
    user: AuthUser
  ): TrainingReport {
    return {
      institutionId: training.institutionId,
      institution: training.institution,
      groupId: training.groupId,
      group: training.group,
      cycleId: training.cycleId,
      cycle: training.cycle,
      trainingId: training.id,
      userId: user.uid,
      status: TrainingStatus.IN_PROGRESS,
      prescribed: TrainingReportService.getTrainingStats(training),
      components: training.components.length,
      supersets: training.components.reduce((acc, component) => {
        return (
          acc +
          component.supersets.reduce((supAcc, superset) => {
            return supAcc + superset.exercises.length;
          }, 0)
        );
      }, 0),
      reps: 0,
      tonnage: 0,
      tut: 0,
      time: 0,
      dist: 0,
      recTime: 0,
      recDist: 0,
      duration: 0,
      exercises: training.components.reduce(
        (acc, component) =>
          component.supersets.reduce((acc, superset) => {
            return (
              acc +
              superset.exercises.filter(
                (ex, index, self) =>
                  index === superset.exercises.findIndex((e) => e.id === ex.id)
              ).length
            );
          }, 0),
        0
      ),
      sets: training.components.reduce(
        (acc, component) =>
          component.supersets.reduce((acc, superset) => {
            return (
              acc +
              superset.exercises.reduce((exAcc, exercise) => {
                return exAcc + exercise.sets.length;
              }, 0)
            );
          }, 0),
        0
      ),
      realization: 0,
      muscleValues: [],
      componentStatuses: [
        {
          componentId: component.id,
          status: TrainingStatus.IN_PROGRESS,
        },
      ],
      from: training.from,
      to: training.to,
    };
  }

  private static getTrainingStats(training: Training): PrescribedTrainingStats {
    const stats: PrescribedTrainingStats = {
      plannedComponents: training.components.map((c) => ({
        componentId: c.id,
        totalSets: c.supersets.reduce(
          (sum, s) =>
            sum + s.exercises.reduce((s2, e) => s2 + e.sets.length, 0),
          0
        ),
      })),
      duration: Math.abs(
        dayjs(training.to).diff(dayjs(training.from), 'minute')
      ),
      components: training.components.length,
      supersets: 0,
      exercises: new Set<string>(
        training.components.flatMap((c) =>
          c.supersets.flatMap((s) => s.exercises.map((e) => e.id))
        )
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

  private static getSetReport(set: ExerciseSet): SetReport {
    const tonnageL = set.reps && set.loadKg ? set.reps * set.loadKg : 0;
    const tonnageR = set.repsR && set.loadKgR ? set.repsR * set.loadKgR : 0;

    let tutL = set.reps
      ? set.reps * (this.getTempoTime(set) || REP_TEMPO_TIME_IN_S)
      : 0;

    if (set.time !== undefined && set.time > 0) tutL = set.time; // override if time based work is specified

    let tutR = set.repsR
      ? set.repsR * (this.getTempoRTime(set) || REP_TEMPO_TIME_IN_S)
      : 0;

    if (set.timeR !== undefined && set.timeR > 0) tutR = set.timeR;

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

  private static getTempoTime(set: ExerciseSet): number {
    return (
      (set.tempoEcc || 0) +
      (set.tempoIso || 0) +
      (set.tempoCon || 0) +
      (set.tempoIdle || 0)
    );
  }

  private static getTempoRTime(set: ExerciseSet): number {
    return (
      (set.tempoEccR || 0) +
      (set.tempoIsoR || 0) +
      (set.tempoConR || 0) +
      (set.tempoIdleR || 0)
    );
  }
}
