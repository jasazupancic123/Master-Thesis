import { BaseController } from '../base.controller';
import type { UserId } from '../institution/type/institution.type';
import type {
  ActiveTraining,
  CreateTraining,
  FilterTrainings,
  PeriodizeTrainings,
  Training,
  UpdateTraining,
} from './type/training.type';
import type { TrainingComponent } from './type/training-component.type';
import type {
  GroupTrainingReportItem,
  TrainingReport,
  UserTrainingRealizationReportItem,
} from './type/training-report.type';
import type { CreateWorkload, Workload } from './type/workload.type';
import type { FetchOptions } from '@/lib/common/type/api.type';
import type { DateRange } from '@/lib/common/type/date-range.type';
import type { ValidateError } from '@/lib/common/type/validate-row-error.type';

export class TrainingController extends BaseController {
  private static instance: TrainingController;

  private constructor() {
    super('/training');
  }

  static getInstance() {
    if (!this.instance) this.instance = new TrainingController();
    return this.instance;
  }

  async findAll(query: FilterTrainings, options?: FetchOptions) {
    return this.api.get<Training[]>('/', { query, ...options });
  }

  async findAllIndividual(trainingId: string, options?: FetchOptions) {
    return this.api.get<Record<string, Training>>(
      `/${trainingId}/individual`,
      options
    );
  }

  async getActiveTrainingByAthlete(options?: FetchOptions) {
    return this.api.get<ActiveTraining | null>(`/get/active`, options);
  }

  async getGroupReport(groupId: string, componentId?: string) {
    return await this.api.get<Record<string, GroupTrainingReportItem>>(
      `/report/group`,
      { query: { groupId, ...(componentId ? { componentId } : {}) } }
    );
  }

  async getUserTrainingsRealizationReport(
    institutionId: string,
    athleteId: string,
    componentId?: string
  ) {
    return await this.api.get<UserTrainingRealizationReportItem[]>(
      `/report/athlete/trainings-realization`,
      {
        query: {
          institutionId,
          athleteId,
          ...(componentId ? { componentId } : {}),
        },
      }
    );
  }

  async getUserExerciseReport(
    institutionId: string,
    athleteId: string,
    exerciseId: string
  ) {
    return await this.api.get<Workload[]>(
      `/report/athlete/exercise/${exerciseId}`,
      { query: { athleteId, institutionId } }
    );
  }

  async generateQRCode(
    trainingId: string,
    componentId: string,
    athleteId: string,
    options?: FetchOptions
  ) {
    return this.api.post<{ link: string }>(
      `/${trainingId}/component/${componentId}/generate-qr-code`,
      { userId: athleteId },
      options
    );
  }

  async findReports(institutionId: string, options?: FetchOptions) {
    return this.api.get<TrainingReport[]>('/report/athlete', {
      query: { institutionId },
      ...options,
    });
  }

  async findAllByInstitutionToday(options?: FetchOptions) {
    return this.api.get<Training[]>('/institution/today', options);
  }

  async completeNextSet(
    trainingId: string,
    exerciseId: string,
    body: CreateWorkload,
    options?: FetchOptions
  ) {
    return this.api.post<Workload>(
      `/${trainingId}/exercise/${exerciseId}/complete-next-set`,
      body,
      options
    );
  }

  async upsertSet(
    trainingId: string,
    componentId: string,
    exerciseId: string,
    supersetIndex: number,
    setNumber: number,
    body: CreateWorkload,
    options?: FetchOptions
  ) {
    return this.api.post<Workload>(
      `/${trainingId}/component/${componentId}/exercise/${exerciseId}/superset/${supersetIndex}/set/${setNumber}`,
      body,
      options
    );
  }

  async startTrainingComponent(
    trainingId: string,
    componentId: string,
    athleteId?: string,
    options?: FetchOptions
  ) {
    return this.api.post<{
      errors: ValidateError<Record<string, unknown>>;
      trainings: Record<string, Training>;
    }>(
      `/${trainingId}/component/${componentId}/start`,
      { userId: athleteId },
      options
    );
  }

  async completeTrainingComponent(
    trainingId: string,
    componentId: string,
    athleteId?: string,
    options?: FetchOptions
  ) {
    return this.api.post<{
      errors: ValidateError<Record<string, unknown>>;
    }>(
      `/${trainingId}/component/${componentId}/complete`,
      { userId: athleteId },
      options
    );
  }

  async pauseTrainingComponent(
    trainingId: string,
    componentId: string,
    options?: FetchOptions
  ) {
    return this.api.patch<void>(
      `/${trainingId}/component/${componentId}/pause`,
      {},
      options
    );
  }

  async findCompletedAthleteWorkloads(
    trainingId: string,
    userId: string,
    options?: FetchOptions
  ) {
    return this.api.get<Workload[]>(
      `/${trainingId}/athlete/${userId}/workloads`,
      options
    );
  }

  async create(
    body: CreateTraining,
    options?: FetchOptions
  ): Promise<Training> {
    return this.api.post<Training>('/', body, options);
  }

  async update(
    trainingId: string,
    body: UpdateTraining,
    options?: FetchOptions
  ) {
    return this.api.patch<Training>(`/${trainingId}`, body, options);
  }

  async updateComponentTime(
    trainingId: string,
    componentId: string,
    body: Required<DateRange>,
    options?: FetchOptions
  ) {
    return this.api.patch<Pick<Training, 'components' | 'from' | 'to'>>(
      `/${trainingId}/component/${componentId}/time`,
      body,
      options
    );
  }

  async move(trainingId: string, body: DateRange) {
    return this.api.patch<void>(`/${trainingId}/move`, body);
  }

  async delete(trainingId: string, options?: FetchOptions) {
    await this.api.delete<null>(`/${trainingId}`, options);
    return null;
  }

  async periodize(
    baseTrainingId: string,
    componentId: string,
    body: PeriodizeTrainings,
    options?: FetchOptions
  ) {
    return this.api.patch<Training[]>(
      `/${baseTrainingId}/periodize/component/${componentId}`,
      body,
      options
    );
  }

  async addComponents(
    trainingId: string,
    body: { components: TrainingComponent[] },
    options?: FetchOptions
  ) {
    return this.api.post<Training>(`/${trainingId}/component`, body, options);
  }

  async deleteComponent(
    trainingId: string,
    componentId: string,
    options?: FetchOptions
  ) {
    return this.api.delete<Training>(
      `/${trainingId}/component/${componentId}`,
      options
    );
  }

  async addMember(trainingId: string, body: UserId, options?: FetchOptions) {
    return this.api.patch<void>(`/${trainingId}/member`, body, options);
  }

  async removeMember(trainingId: string, body: UserId, options?: FetchOptions) {
    return this.api.delete<void>(`/${trainingId}/member`, { body, ...options });
  }
}
