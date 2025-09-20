import { Injectable } from '@nestjs/common';
import { compareAsc, differenceInMinutes } from 'date-fns';

import { TrainingReportRef } from '@src/common/type/firestore.type';
import { IntType, VolType } from '@src/component/enum/param.enum';

import { ExerciseSet } from '../entity/exercise-set.entity';
import { Training } from '../entity/training.entity';
import { TrainingReport } from '../entity/training-report.entity';
import { TrainingStats } from '../entity/training-stats.entity';
import { Workload } from '../entity/workload.entity';
import { TrainingReportRepository } from '../repository/training-report.repository';
import { TrainingPlanService } from './training-plan.service';
import { WorkloadService } from './workload.service';

@Injectable()
export class TrainingReportService {
  constructor(
    private readonly repository: TrainingReportRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadService: WorkloadService,
  ) {}

  async updateReport(
    userId: string,
    training: Training,
    additionalInput?: { photoURL?: string },
  ): Promise<void> {
    const ref: TrainingReportRef = { trainingId: training.id, userId };
    const workloads = (
      await this.workloadService.findAllByUserTraining(userId, ref)
    ).sort((a, b) => compareAsc(new Date(a.createdAt), new Date(b.createdAt)));

    const stats = this.getTrainingStats(training);
    const from = workloads[0]?.createdAt || training.from;
    const to = workloads[workloads.length - 1]?.updatedAt || training.to;
    const components = new Set(workloads.map((w) => w.componentId));

    const report: TrainingReport = {
      ...stats,
      ...ref,
      from,
      to,
      completed: workloads.length >= stats.totalSets,
      duration: differenceInMinutes(to, from),
      sets: workloads.length,
      components: components.size,
      reps: 0,
      tonnage: 0,
      tempoTime: 0,
      recTime: 0,
      activeTime: 0,
      realizationPoints: 0,
      exerciseMuscleValues: [], // to be calculated
      photoURL: additionalInput?.photoURL,
      completedComponentIds: Array.from(components),
    };

    for (const workload of workloads) {
      const info = this.getSetInfo(workload);
      const tonnage = this.calculateTonnage(1, info.reps, info.load);

      report.reps += info.reps;
      report.tonnage += tonnage;
      report.tempoTime += info.tempoTime;
      report.recTime += info.recTime;

      report.activeTime += this.calculateActiveTime(
        info.reps,
        info.time || 1,
        info.tempoTime,
      );

      report.realizationPoints += this.calculateRealizationPoints(
        tonnage,
        info.tempoTime,
      );
    }

    await this.repository.save(ref, report);
  }

  private getTrainingStats(training: Training): TrainingStats {
    const stats: TrainingStats = {
      totalComponents: training.components.length,
      totalSupersets: 0,
      totalExercises: 0,
      totalSets: 0,
      totalReps: 0,
      totalLoad: 0,
      totalTonnage: 0,
      totalTempo: 0,
      totalRecTime: 0,
      totalActiveTime: 0,
      totalRealizationScore: 0,
    };

    for (const component of training.components)
      for (const superset of component.supersets) {
        stats.totalSupersets += 1;

        for (const exercise of superset.exercises) {
          const sets = exercise.sets.length;
          stats.totalExercises += 1;
          stats.totalSets += sets;

          for (const set of exercise.sets) {
            const info = this.getSetInfo(set);
            const tonnage = this.calculateTonnage(1, info.reps, info.load);

            stats.totalReps += info.reps;
            stats.totalLoad += info.load;
            stats.totalTonnage += tonnage;
            stats.totalRecTime += info.recTime;
            stats.totalTempo += info.tempoTime; // TODO - have default tempo time values for exercises

            stats.totalActiveTime += this.calculateActiveTime(
              info.reps,
              info.time || 1,
              info.tempoTime,
            );

            stats.totalRealizationScore += this.calculateRealizationPoints(
              tonnage,
              info.tempoTime,
            );

            if (info.time > 0) {
              if (!stats.totalTimeVol) stats.totalTimeVol = 0;
              stats.totalTimeVol += info.time;
            }

            if (info.dist > 0) {
              if (!stats.totalDistVol) stats.totalDistVol = 0;
              stats.totalDistVol += info.dist;
            }

            if (info.recDist > 0) {
              if (!stats.totalRecDist) stats.totalRecDist = 0;
              stats.totalRecDist += info.recDist;
            }
          }
        }
      }

    return stats;
  }

  getSetInfo(set: ExerciseSet | Workload) {
    return isWorkload(set)
      ? this.getSetInfoFromWorkload(set)
      : this.getSetInfoFromSet(set);
  }

  calculateTonnage(sets: number, reps: number, load: number): number {
    return sets * reps * load;
  }

  calculateActiveTime(
    reps: number,
    volTime: number,
    tempoTime: number,
  ): number {
    return reps * volTime * tempoTime;
  }

  calculateRealizationPoints(tonnage: number, tempoTime: number): number {
    const tempoFactor = tempoTime ? 1 / tempoTime : 1;
    return tonnage * tempoFactor;
  }

  private getSetInfoFromSet(set: ExerciseSet) {
    const reps =
      (this.trainingPlanService.getReps(set.paramValuesL) || 1) +
      this.trainingPlanService.getReps(set.paramValuesR || []);

    const time =
      this.trainingPlanService.getTime(set.paramValuesL) +
      this.trainingPlanService.getTime(set.paramValuesR || []);

    const dist =
      this.trainingPlanService.getDistance(set.paramValuesL) +
      this.trainingPlanService.getDistance(set.paramValuesR || []);

    const recTime =
      this.trainingPlanService.getRecTime(set.paramValuesL) +
      this.trainingPlanService.getRecTime(set.paramValuesR || []);

    const recDist =
      this.trainingPlanService.getRecDist(set.paramValuesL) +
      this.trainingPlanService.getRecDist(set.paramValuesR || []);

    const tempoTime =
      this.trainingPlanService.getTempoSeconds(set.paramValuesL) +
        this.trainingPlanService.getTempoSeconds(set.paramValuesR || []) || 1;

    const load =
      this.trainingPlanService.getKg(set.paramValuesL) +
      this.trainingPlanService.getBw(set.paramValuesL) +
      this.trainingPlanService.getRm(set.paramValuesL) +
      this.trainingPlanService.getKg(set.paramValuesR || []) +
      this.trainingPlanService.getBw(set.paramValuesR || []) +
      this.trainingPlanService.getRm(set.paramValuesR || []);

    return { reps, time, dist, load, recTime, recDist, tempoTime };
  }

  private getSetInfoFromWorkload(workload: Workload) {
    const reps =
      (workload.volWork1Type === VolType.Rep
        ? workload.volWork1ValueL || 0 + workload.volWork1ValueR || 0
        : 1) || 1;

    const time =
      workload.volWork1Type === VolType.Time
        ? (workload.volWork1ValueL || 0) + (workload.volWork1ValueR || 0)
        : workload.volWork2Type === VolType.Time
          ? (workload.volWork2ValueL || 0) + (workload.volWork2ValueR || 0)
          : 0;

    const dist =
      workload.volWork1Type === VolType.Dist
        ? (workload.volWork1ValueL || 0) + (workload.volWork1ValueR || 0)
        : workload.volWork2Type === VolType.Dist
          ? (workload.volWork2ValueL || 0) + (workload.volWork2ValueR || 0)
          : 0;

    const recTime =
      workload.volRecType === VolType.Time
        ? (workload.volRecValueL || 0) + (workload.volRecValueR || 0)
        : 0;

    const recDist =
      workload.volRecType === VolType.Dist
        ? (workload.volRecValueL || 0) + (workload.volRecValueR || 0)
        : 0;

    const tempoTime =
      (workload.intWork1Type === IntType.Tempo
        ? (sumOfDigits(workload.intWork1ValueL) || 0) +
          (sumOfDigits(workload.intWork1ValueR) || 0)
        : workload.intWork2Type === IntType.Tempo
          ? (sumOfDigits(workload.intWork2ValueL) || 0) +
            (sumOfDigits(workload.intWork2ValueR) || 0)
          : 1) || 1;

    const load = [IntType.Kg, IntType.Bw, IntType.Rm].includes(
      workload.intWork1Type,
    )
      ? (workload.intWork1ValueL || 0) + (workload.intWork1ValueR || 0)
      : [IntType.Kg, IntType.Bw, IntType.Rm].includes(workload.intWork2Type)
        ? (workload.intWork2ValueL || 0) + (workload.intWork2ValueR || 0)
        : 0;

    return { reps, time, dist, load, recTime, recDist, tempoTime };
  }
}

function sumOfDigits(num: number): number {
  return Math.abs(num) // handle negatives
    .toString()
    .split('')
    .reduce((sum, digit) => sum + Number(digit), 0);
}

function isWorkload(entity: ExerciseSet | Workload): entity is Workload {
  return (entity as Workload).volWork1Type !== undefined;
}
