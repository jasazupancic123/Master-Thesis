import { BaseController } from '../base.controller';
import type { UserId } from '../institution/type/institution.type';
import type { CompletedFutureWorkloads } from './type/completed-future-workloads.type';
import type { CompletedTrainingComponent } from './type/completed-training.entity';
import type {
  CopyTraining,
  CreateTraining,
  FilterTrainings,
  PeriodizeTrainings,
  Training,
  UpdateTraining,
} from './type/training.type';
import type {
  CopyComponent,
  TrainingComponent,
} from './type/training-component.type';

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

  async findAthleteWorkloads(trainingId: string, userId: string) {
    return this.api.get<CompletedFutureWorkloads>(
      `/${trainingId}/athlete/${userId}/workloads`,
      { token: this.getToken() }
    );
  }

  async create(body: CreateTraining): Promise<Training> {
    return this.api.post<Training>('/', body, {
      token: this.getToken(),
    });
  }

  async copyComponent(body: CopyComponent) {
    return this.api.post<Training>('/copy/component', body, {
      token: this.getToken(),
    });
  }

  async update(trainingId: string, body: UpdateTraining) {
    return this.api.patch<Training>(`/${trainingId}`, body, {
      token: this.getToken(),
    });
  }

  async copy(trainingId: string, body: CopyTraining) {
    return this.api.post<Training>(`/${trainingId}/copy`, body, {
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
