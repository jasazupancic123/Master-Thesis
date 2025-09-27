import { Injectable } from '@nestjs/common';
import { compareAsc, differenceInMinutes } from 'date-fns';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { TrainingReportRef } from '@src/common/type/firestore.type';
import { IntType, ParamType, VolType } from '@src/component/enum/param.enum';

import {
  DIST_TIME_IN_S,
  REP_TEMPO_TIME_IN_S,
} from '../constant/training-limits.constant';
import { ExerciseSet } from '../entity/exercise-set.entity';
import { Training } from '../entity/training.entity';
import { TrainingReport } from '../entity/training-report.entity';
import { TrainingStats } from '../entity/training-stats.entity';
import { Workload } from '../entity/workload.entity';
import { TrainingReportRepository } from '../repository/training-report.repository';
import { SetReport, TrainingSet } from '../type/training-set.type';
import { TrainingPlanService } from './training-plan.service';
import { WorkloadService } from './workload.service';

@Injectable()
export class TrainingReportService {
  constructor(
    private readonly repository: TrainingReportRepository,
    private readonly trainingPlanService: TrainingPlanService,
    private readonly workloadService: WorkloadService,
  ) {}

  async findAllByUser(
    userId: string,
    filter?: DateFilterDto & { institutionId?: string },
  ): Promise<TrainingReport[]> {
    return await this.repository.getAllByUser(userId, filter);
  }

  async findOneById(ref: TrainingReportRef): Promise<TrainingReport | null> {
    return await this.repository.findById(ref);
  }

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
    const from = workloads[0]?.createdAt || new Date();
    const to = workloads[workloads.length - 1]?.updatedAt || from;

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
      activeTime: 0,
      tonnage: 0,
      timeWork: 0,
      distWork: 0,
      power: 0,
      realization: 0,
      muscleValues: [], // to be calculated
      photoURL: additionalInput?.photoURL,
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
      const prescribed = this.getPrescribedWorkloadSet(workload);
      const completed = this.getCompletedWorkloadSet(workload);
      const setReport = this.getSetReport(completed);

      report.reps += setReport.reps;
      report.recTime += setReport.recTime;
      report.activeTime += setReport.activeTime;
      report.tonnage += setReport.tonnage;
      report.timeWork += setReport.timeWork;
      report.distWork += setReport.distWork;
      report.power = report.tonnage / report.activeTime; // kg per second

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

      if (prescribed.repsR > 0) {
        // unilateral exercise
        const repsLDiv =
          prescribed.repsL > 0 ? completed.repsL / prescribed.repsL : 1;
        const repsRDiv =
          prescribed.repsR > 0 ? completed.repsR / prescribed.repsR : 1;
        const loadLDiv =
          prescribed.loadL > 0 ? completed.loadL / prescribed.loadL : 1;
        const loadRDiv =
          prescribed.loadR > 0 ? completed.loadR / prescribed.loadR : 1;
        const tempoLDiv =
          prescribed.tempoL > 0 ? completed.tempoL / prescribed.tempoL : 1;
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
          prescribed.repsL > 0 ? completed.repsL / prescribed.repsL : 1;
        const loadDiv =
          prescribed.loadL > 0 ? completed.loadL / prescribed.loadL : 1;
        const tempoDiv =
          prescribed.tempoL > 0 ? completed.tempoL / prescribed.tempoL : 1;
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
      totalTimeWork: 0,
      totalDistWork: 0,
      totalPower: 0,
    };

    for (const component of training.components)
      for (const superset of component.supersets) {
        stats.totalSupersets += 1;

        for (const exercise of superset.exercises) {
          const sets = exercise.sets.length;
          stats.totalSets += sets;

          for (const set of exercise.sets) {
            const data = this.getPrescribedSet(set);
            const setReport = this.getSetReport(data);

            stats.totalReps += setReport.reps;
            stats.totalRecTime += setReport.recTime;
            stats.totalActiveTime += setReport.activeTime;
            stats.totalTonnage += setReport.tonnage;
            stats.totalTimeWork += setReport.timeWork;
            stats.totalDistWork += setReport.distWork;
            stats.totalPower = stats.totalTonnage / stats.totalActiveTime; // kg per second

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

  private getPrescribedSet(s: ExerciseSet): TrainingSet {
    // mandatory fields
    const repsLField = s.paramValuesL.find((p) => p.selected === VolType.Rep);
    const repsRField = s.paramValuesR?.find((p) => p.selected === VolType.Rep);
    const repsL = repsLField ? +repsLField.value || 1 : 1; // default 1 rep if not specified
    const repsR = repsRField ? +repsRField.value || 0 : 0;

    const fields: string[] = [IntType.Kg, IntType.Bw, IntType.Rm];
    const loadLField = s.paramValuesL.find((p) => fields.includes(p.selected));
    const loadRField = s.paramValuesR?.find((p) => fields.includes(p.selected));
    const loadL = loadLField ? +loadLField.value || 0 : 0; // load is saved as kg, even if prescription is bw or rm
    const loadR = loadRField ? +loadRField.value || 0 : 0;

    const defTmp = REP_TEMPO_TIME_IN_S; // default 3 seconds per rep
    const tmpLField = s.paramValuesL.find((p) => p.selected === IntType.Tempo);
    const tmpRField = s.paramValuesR?.find((p) => p.selected === IntType.Tempo);

    const [tempoL, tempoR] = [
      this.trainingPlanService.tempoToSeconds(+tmpLField?.value) || defTmp,
      this.trainingPlanService.tempoToSeconds(+tmpRField?.value) || defTmp,
    ];

    const recField = s.paramValuesL.find((p) => p.field === ParamType.VolRec1);
    const recTime =
      recField && recField.selected === VolType.Time ? +recField.value || 0 : 0; // this is also total recovery time, together for all reps, since is for 1 set only

    // optional fields
    const tFields: string[] = [ParamType.VolWork1, ParamType.VolWork2];
    const timeLField = s.paramValuesL.find(
      (p) => tFields.includes(p.field) && p.selected === VolType.Time,
    );

    const timeRField = s.paramValuesR?.find(
      (p) => tFields.includes(p.field) && p.selected === VolType.Time,
    );

    const timeL = timeLField ? +timeLField.value || 0 : 0;
    const timeR = timeRField ? +timeRField.value || 0 : 0;

    const distLField = s.paramValuesL.find((p) => p.selected === VolType.Dist);
    const distRField = s.paramValuesR?.find((p) => p.selected === VolType.Dist);
    const distL = distLField ? +distLField.value || 0 : 0;
    const distR = distRField ? +distRField.value || 0 : 0;

    const recDistField = s.paramValuesL.find(
      (p) => p.field === ParamType.IntRec1,
    );

    const recDist =
      recDistField && recDistField.selected === VolType.Dist
        ? +recDistField.value || 0
        : 0;

    return {
      repsL,
      repsR,
      loadL,
      loadR,
      recTime,
      tempoL,
      tempoR,
      timeL,
      timeR,
      distL,
      distR,
      recDist,
    };
  }

  private getCompletedWorkloadSet(w: Workload): TrainingSet {
    // mandatory fields
    const repsL = w.volWork1Type === VolType.Rep ? w.volWork1ValueL || 1 : 1;
    const repsR = w.volWork1Type === VolType.Rep ? w.volWork1ValueR || 0 : 0;

    const fields = [IntType.Kg, IntType.Bw, IntType.Rm];
    const loadL = fields.includes(w.intWork1Type) ? w.intWork1ValueL || 0 : 0; // load is saved as kg, even if prescription is bw or rm
    const loadR = fields.includes(w.intWork1Type) ? w.intWork1ValueR || 0 : 0;

    const defaultTempo = REP_TEMPO_TIME_IN_S; // default 3 seconds per rep
    const [tempoL, tempoR] = [
      this.trainingPlanService.tempoToSeconds(w.intWork2ValueL) || defaultTempo,
      this.trainingPlanService.tempoToSeconds(w.intWork2ValueR) || defaultTempo,
    ];

    const recTime = w.volRecType === VolType.Time ? w.volRecValueL || 0 : 0; // this is also total recovery time, together for all reps, since is for 1 set only

    // optional fields
    const timeL = w.volWork1Type === VolType.Time ? w.volWork1ValueL || 0 : 0;
    const timeR = w.volWork1Type === VolType.Time ? w.volWork1ValueR || 0 : 0;
    const distL = w.volWork1Type === VolType.Dist ? w.volWork1ValueL || 0 : 0;
    const distR = w.volWork1Type === VolType.Dist ? w.volWork1ValueR || 0 : 0;
    const recDist = w.volRecType === VolType.Dist ? w.volRecValueL || 0 : 0;

    return {
      repsL,
      repsR,
      loadL,
      loadR,
      recTime,
      tempoL,
      tempoR,
      timeL,
      timeR,
      distL,
      distR,
      recDist,
    };
  }

  private getPrescribedWorkloadSet(w: Workload): TrainingSet {
    const repsL =
      w.volWork1Type === VolType.Rep ? w.prescribedVolWork1ValueL || 1 : 1;

    const repsR =
      w.volWork1Type === VolType.Rep ? w.prescribedVolWork1ValueR || 0 : 0;

    const fields = [IntType.Kg, IntType.Bw, IntType.Rm];
    const loadL = fields.includes(w.intWork1Type)
      ? w.prescribedIntWork1ValueL || 0
      : 0;
    const loadR = fields.includes(w.intWork1Type)
      ? w.prescribedIntWork1ValueR || 0
      : 0;

    const defaultTempo = REP_TEMPO_TIME_IN_S;
    const [tempoL, tempoR] = [
      this.trainingPlanService.tempoToSeconds(w.prescribedIntWork2ValueL) ||
        defaultTempo,
      this.trainingPlanService.tempoToSeconds(w.prescribedIntWork2ValueR) ||
        defaultTempo,
    ];

    const recTime =
      w.volRecType === VolType.Time ? w.prescribedVolRecValueL || 0 : 0;

    const timeL =
      w.volWork1Type === VolType.Time ? w.prescribedVolWork1ValueL || 0 : 0;

    const timeR =
      w.volWork1Type === VolType.Time ? w.prescribedVolWork1ValueR || 0 : 0;

    const distL =
      w.volWork1Type === VolType.Dist ? w.prescribedVolWork1ValueL || 0 : 0;

    const distR =
      w.volWork1Type === VolType.Dist ? w.prescribedVolWork1ValueR || 0 : 0;

    const recDist =
      w.volRecType === VolType.Dist ? w.prescribedVolRecValueL || 0 : 0;

    return {
      repsL,
      repsR,
      loadL,
      loadR,
      recTime,
      tempoL,
      tempoR,
      timeL,
      timeR,
      distL,
      distR,
      recDist,
    };
  }

  private getSetReport(set: TrainingSet): SetReport {
    const {
      repsL,
      repsR,
      loadL,
      loadR,
      recTime,
      tempoL,
      tempoR,
      timeL,
      timeR,
      distL,
      distR,
      recDist,
    } = set;

    const reps = repsL + repsR;
    const load = loadL + loadR;
    const time = timeL + timeR;
    const dist = distL + distR;

    // calculated fields
    const tonnage = repsL * loadL + repsR * loadR;

    let activeTime = repsL * tempoL + repsR * tempoR; // defaults to 1 rep x 3 seconds
    if (time > 0)
      activeTime = time; // override if time based work is specified
    else if (dist > 0) {
      const velocity = DIST_TIME_IN_S; // 1 m per second
      activeTime = dist * velocity;
    }

    let timeWork = 0;
    if (load > 0) {
      if (time > 0) timeWork = loadL * timeL + loadR * timeR;
      else timeWork = loadL * repsL * tempoL + loadR * repsR * tempoR; // tempo is time
    }

    let distWork = 0;
    if (load > 0 && dist > 0) distWork = loadL * distL + loadR * distR;

    const power = tonnage / activeTime; // kg per second

    return {
      reps,
      load,
      recTime,
      time,
      dist,
      recDist,
      activeTime,
      tonnage,
      timeWork,
      distWork,
      power,
    };
  }
}
