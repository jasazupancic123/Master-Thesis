import { BaseController } from '../base.controller';
import type { UserId } from '../institution/type/institution.type';
import type { CompletedTrainingComponent } from './type/completed-training.entity';
import type {
  CreateTraining,
  FilterTrainings,
  PeriodizeTrainings,
  Training,
  UpdateTraining,
} from './type/training.type';
import type { TrainingComponent } from './type/training-component.type';
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

  async getPrescribedTraining(
    trainingId: string,
    userId: string
  ): Promise<Training | null> {
    return this.api.get<Training | null>(
      `/${trainingId}/athlete/${userId}/prescribed`,
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

  async completeTrainingComponent(
    trainingId: string,
    componentId: string,
    body: CompletedTrainingComponent
  ): Promise<Training> {
    return this.api.patch<Training>(
      `/${trainingId}/component/${componentId}/complete`,
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
