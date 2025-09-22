import { BaseController } from '../base.controller';
import type { UserId } from '../institution/type/institution.type';
import type { CompleteSet } from './type/complete-set.type';
import type {
  CreateTraining,
  FilterTrainings,
  PeriodizeTrainings,
  Training,
  UpdateTraining,
} from './type/training.type';
import type { TrainingComponent } from './type/training-component.type';
import type { TrainingReport } from './type/training-report.type';
import type { Workload } from './type/workload.type';
import type { DateRange } from '@/common/type/date-range.type';

export class TrainingController extends BaseController {
  private static instance: TrainingController;

  private constructor() {
    super('/training');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new TrainingController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findAll(query?: FilterTrainings) {
    return this.api.get<Training[]>('/', {
      query,
      token: this.getToken(),
    });
  }

  async findOneById(trainingId: string) {
    return this.api.get<{ training: Training; report: TrainingReport }>(
      `/${trainingId}`,
      { token: this.getToken() }
    );
  }

  async findReports(query?: DateRange) {
    return this.api.get<TrainingReport[]>('/report/athlete', {
      query,
      token: this.getToken(),
    });
  }

  async findAllByInstitutionToday() {
    return this.api.get<Training[]>('/institution/today', {
      token: this.getToken(),
    });
  }

  async getPrescribedTraining(
    trainingId: string,
    userId: string
  ): Promise<Training | null> {
    return this.api.get<Training | null>(
      `/${trainingId}/athlete/${userId}/prescribed`,
      { token: this.getToken() }
    );
  }

  async completeNextSet(
    trainingId: string,
    exerciseId: string,
    body: CompleteSet
  ) {
    return this.api.post<Workload>(
      `/${trainingId}/exercise/${exerciseId}/complete-next-set`,
      body,
      { token: this.getToken() }
    );
  }

  async upsertSet(
    trainingId: string,
    componentId: string,
    exerciseId: string,
    supersetIndex: number,
    setNumber: number,
    body: CompleteSet
  ) {
    return this.api.post<Workload>(
      `/${trainingId}/component/${componentId}/exercise/${exerciseId}/superset/${supersetIndex}/set/${setNumber}`,
      body,
      { token: this.getToken() }
    );
  }

  async findCompletedAthleteWorkloads(trainingId: string, userId: string) {
    return this.api.get<Workload[]>(
      `/${trainingId}/athlete/${userId}/workloads`,
      { token: this.getToken() }
    );
  }

  async create(body: CreateTraining): Promise<Training> {
    return this.api.post<Training>('/', body, {
      token: this.getToken(),
    });
  }

  async update(trainingId: string, body: UpdateTraining) {
    return this.api.patch<Training>(`/${trainingId}`, body, {
      token: this.getToken(),
    });
  }

  async updateComponentTime(
    trainingId: string,
    componentId: string,
    body: Required<DateRange>
  ) {
    return this.api.patch<
      Pick<Training, 'components' | 'warmup' | 'cooldown' | 'from' | 'to'>
    >(`/${trainingId}/component/${componentId}/time`, body, {
      token: this.getToken(),
    });
  }

  async delete(trainingId: string) {
    await this.api.delete<null>(`/${trainingId}`, {
      token: this.getToken(),
    });

    return null;
  }

  async periodize(
    baseTrainingId: string,
    componentId: string,
    body: PeriodizeTrainings
  ) {
    return this.api.patch<Training[]>(
      `/${baseTrainingId}/periodize/component/${componentId}`,
      body,
      { token: this.getToken() }
    );
  }

  async addComponents(
    trainingId: string,
    body: { components: TrainingComponent[] }
  ) {
    return this.api.post<Training>(`/${trainingId}/component`, body, {
      token: this.getToken(),
    });
  }

  async deleteComponent(trainingId: string, componentId: string) {
    return this.api.delete<Training>(
      `/${trainingId}/component/${componentId}`,
      { token: this.getToken() }
    );
  }

  async addMember(trainingId: string, body: UserId) {
    return this.api.patch<void>(`/${trainingId}/member`, body, {
      token: this.getToken(),
    });
  }

  async removeMember(trainingId: string, body: UserId) {
    return this.api.delete<void>(`/${trainingId}/member`, {
      body,
      token: this.getToken(),
    });
  }
}
