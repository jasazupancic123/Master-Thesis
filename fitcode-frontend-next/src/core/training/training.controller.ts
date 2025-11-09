import { BaseController } from '../base.controller';
import type { UserId } from '../institution/type/institution.type';
import type { TrainingStatus } from './enum/training-status.enum';
import type {
  CreateTraining,
  FilterTrainings,
  PeriodizeTrainings,
  Training,
  UpdateTraining,
} from './type/training.type';
import type { TrainingComponent } from './type/training-component.type';
import type { TrainingReport } from './type/training-report.type';
import type { CreateWorkload, Workload } from './type/workload.type';
import type { FetchOptions } from '@/lib/common/type/api.type';
import type { DateRange } from '@/lib/common/type/date-range.type';

export class TrainingController extends BaseController {
  private static instance: TrainingController;

  private constructor() {
    super('/training');
  }

  static getInstance() {
    if (!this.instance) this.instance = new TrainingController();
    return this.instance;
  }

  async findAll(query?: FilterTrainings, options?: FetchOptions) {
    return this.api.get<Training[]>('/', { query, ...options });
  }

  async findAllIndividual(trainingId: string, options?: FetchOptions) {
    return this.api.get<Record<string, Training>>(
      `/${trainingId}/individual`,
      options
    );
  }

  async findOneById(trainingId: string, options?: FetchOptions) {
    return this.api.get<{ training: Training; report: TrainingReport }>(
      `/${trainingId}`,
      options
    );
  }

  async getActiveForAthlete(options?: FetchOptions) {
    return this.api.get<{ training: Training | null }>(`/get/active`, options);
  }

  async generateQRCode(
    trainingId: string,
    componentId: string,
    athleteId: string,
    options?: FetchOptions
  ) {
    return this.api.post<string>(
      `/${trainingId}/component/${componentId}/generate-qr-code`,
      { userId: athleteId },
      options
    );
  }

  async findReports(query?: DateRange, options?: FetchOptions) {
    return this.api.get<TrainingReport[]>('/report/athlete', {
      query,
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
    options?: FetchOptions
  ) {
    return this.api.post<Record<string, Training>>(
      `/${trainingId}/component/${componentId}/start`,
      {},
      options
    );
  }

  async finalizeTrainingComponent(
    trainingId: string,
    componentId: string,
    status: TrainingStatus.CANCELLED | TrainingStatus.COMPLETED,
    options?: FetchOptions
  ) {
    return this.api.post<void>(
      `/${trainingId}/component/${componentId}/finalize`,
      { status },
      options
    );
  }

  async updateTrainingComponentStatus(
    trainingId: string,
    componentId: string,
    input: { status: TrainingStatus; userId?: string },
    options?: FetchOptions
  ) {
    return this.api.post<void>(
      `/${trainingId}/component/${componentId}/status`,
      input,
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
