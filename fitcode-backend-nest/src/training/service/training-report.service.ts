import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compareAsc, differenceInMinutes } from 'date-fns';

import { DateFilterDto } from '@src/common/dto/date-filter.dto';
import { Create } from '@src/common/type/entity.type';
import {
  TrainingComponentRef,
  TrainingReportRef,
} from '@src/common/type/firestore.type';
import { Wrapper } from '@src/common/type/wrapper.type';
import { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import { Training } from '@src/training/entity/training.entity';
import { TrainingReport } from '@src/training/entity/training-report.entity';
import { PrescribedTrainingStats } from '@src/training/entity/training-stats.entity';
import { WorkloadService } from '@src/training/service/workload.service';
import { SetReport } from '@src/training/type/training-set.type';

import { REP_TEMPO_TIME_IN_S } from '../constant/training-limits.constant';
import { Workload } from '../entity/workload.entity';
import { TrainingStatus } from '../enum/training-status.enum';
import { TrainingReportRepository } from '../repository/training-report.repository';

@Injectable()
export class TrainingReportService {
  constructor(
    private readonly repository: TrainingReportRepository,
    @Inject(forwardRef(() => WorkloadService))
    private readonly workloadService: Wrapper<WorkloadService>,
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

  async initForComponent(
    input: { userId: string; componentId: string; training: Training }[],
  ): Promise<void> {
    // if training report exists, then just update the correct component status to in_progress, else create new report
    for (const { userId, training, componentId } of input) {
      const ref: TrainingReportRef = { trainingId: training.id, userId };
      const existing = await this.repository.findById(ref);
      if (existing) {
        // update component status
        const componentStatus = existing.componentStatuses.find(
          (cs) => cs.componentId === componentId,
        );

        if (!componentStatus) continue;
        if (componentStatus.status === TrainingStatus.IN_PROGRESS) continue;
        if (componentStatus.status === TrainingStatus.COMPLETED)
          throw new BadRequestException('Training component already completed');

        componentStatus.status = TrainingStatus.IN_PROGRESS;
        await this.repository.update(ref, {
          componentStatuses: existing.componentStatuses,
        });
      } else
        // create new report
        await this.repository.save(
          { trainingId: training.id, userId },
          this.getInitQuery(userId, training, componentId),
        );
    }
  }

  async finalizeForComponent(
    ref: TrainingComponentRef,
    input: { userId: string; status: TrainingStatus }[],
  ): Promise<void> {
    for (const { userId, status } of input) {
      const reportRef: TrainingReportRef = { ...ref, userId };
      const report = await this.findById(reportRef);
      const componentStatus = report?.componentStatuses?.find(
        (cs) => cs.componentId === ref.componentId,
      );

      if (
        !report ||
        !componentStatus ||
        componentStatus.status === TrainingStatus.NOT_STARTED
      )
        throw new BadRequestException('Training component not started yet');

      if (componentStatus.status === TrainingStatus.COMPLETED)
        throw new BadRequestException('Training component already completed');

      componentStatus.status = status;
      await this.repository.update(reportRef, {
        componentStatuses: report.componentStatuses,
        completed: report.componentStatuses.every(
          (cs) => cs.status === TrainingStatus.COMPLETED,
        ),
      });
    }
  }

  async updateStatus(userId: string, ref: TrainingComponentRef) {
    const reportRef: TrainingReportRef = { ...ref, userId };
    const report = await this.findByIdOrFail(reportRef);
  }

  async update(
    userId: string,
    training: Training,
    input?: { photoURLs?: string[] },
  ): Promise<void> {
    const ref: TrainingReportRef = { trainingId: training.id, userId };
    const existing = await this.repository.findById(ref);
    if (!existing) throw new BadRequestException('Training not started yet');

    const workloads = (
      await this.workloadService.findAllByUserTraining(userId, ref)
    ).sort((a, b) => compareAsc(new Date(a.timestamp), new Date(b.timestamp)));

    const stats = this.getTrainingStats(training);
    const from = workloads[0]?.timestamp || new Date();
    const to = workloads[workloads.length - 1]?.timestamp || from;

    const components = new Set(workloads.map((w) => w.componentId));
    const exercises = new Set(workloads.map((w) => w.exerciseId));
    const report: TrainingReport = {
      status: TrainingStatus.IN_PROGRESS,
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
      sets: this.getNumberOfSets(workloads),
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
      componentStatuses: existing.componentStatuses,
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
      const repsDiv = this.div('reps', workload.prescribed, completed);
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

  private getInitQuery(
    userId: string,
    training: Training,
    componentId: string,
  ): Create<TrainingReport> {
    return {
      status: TrainingStatus.IN_PROGRESS,
      from: new Date(),
      to: new Date(),
      prescribed: this.getTrainingStats(training),
      institutionId: training.institutionId,
      groupId: training.groupId,
      cycleId: training.cycleId,
      trainingId: training.id,
      userId,
      completed: false,
      realization: 0,
      muscleValues: [],
      componentStatuses: training.components.map((c) =>
        c.id === componentId
          ? { componentId: c.id, status: TrainingStatus.IN_PROGRESS }
          : { componentId: c.id, status: TrainingStatus.NOT_STARTED },
      ),
      photoURLs: [],
      duration: 0,
      components: 0,
      supersets: 0,
      exercises: 0,
      sets: 0,
      reps: 0,
      tut: 0,
      tonnage: 0,
      time: 0,
      dist: 0,
      recTime: 0,
      recDist: 0,
    };
  }

  private div(
    field: keyof ExerciseSet,
    prescribed: ExerciseSet,
    completed: ExerciseSet,
  ): number {
    if (!prescribed[field]) return;

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
      time: set.time,
      dist: set.dist,
      recTime: set.recTime,
      recDist: set.recDist,
    };
  }

  private getTempoTime(set: ExerciseSet): number {
    return (
      set.tempoEcc ||
      0 + set.tempoIso ||
      0 + set.tempoCon ||
      0 + set.tempoIdle ||
      0
    );
  }

  private getTempoRTime(set: ExerciseSet): number {
    return (
      set.tempoEccR ||
      0 + set.tempoIsoR ||
      0 + set.tempoConR ||
      0 + set.tempoIdleR ||
      0
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
