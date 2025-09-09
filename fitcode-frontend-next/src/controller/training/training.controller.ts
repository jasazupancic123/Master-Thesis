import type { UserId } from '../institution/type/institution.type';
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
import type { Workload } from './type/workload.type';
import { CommonService } from '@/common/service/common.service';

const api = CommonService.instance.api;

export class TrainingController {
  static async findAll(query?: FilterTrainings) {
    return api.get<Training[]>('/training', { query });
  }

  static async getPrescribedTraining(
    trainingId: string,
    userId: string
  ): Promise<Training | null> {
    return api.get<Training | null>(
      `/training/${trainingId}/athlete/${userId}/prescribed`
    );
  }

  static async findCompletedAthleteWorkloads(
    trainingId: string,
    userId: string
  ) {
    return api.get<Workload[]>(
      `/training/${trainingId}/athlete/${userId}/workloads`
    );
  }

  static async create(body: CreateTraining): Promise<Training> {
    return api.post<Training>('/training', body);
  }

  static async copyComponent(body: CopyComponent) {
    return api.post<Training>('/training/copy/component', body);
  }

  static async update(trainingId: string, body: UpdateTraining) {
    return api.patch<Training>(`/training/${trainingId}`, body);
  }

  static async copy(trainingId: string, body: CopyTraining) {
    return api.post<Training>(`/training/${trainingId}/copy`, body);
  }

  static async delete(trainingId: string) {
    await api.delete<null>(`/training/${trainingId}`);
    return null;
  }

  static async periodize(
    baseTrainingId: string,
    componentId: string,
    body: PeriodizeTrainings
  ) {
    return api.patch<Training[]>(
      `/training/${baseTrainingId}/periodize/component/${componentId}`,
      body
    );
  }

  static async completeTrainingComponent(
    trainingId: string,
    componentId: string,
    body: CompletedTrainingComponent
  ): Promise<Training> {
    return api.patch<Training>(
      `/training/${trainingId}/component/${componentId}/complete`,
      body
    );
  }

  static async addComponents(
    trainingId: string,
    body: { components: TrainingComponent[] }
  ) {
    return api.post<Training>(`/training/${trainingId}/component`, body);
  }

  static async deleteComponent(trainingId: string, componentId: string) {
    return api.delete<Training>(
      `/training/${trainingId}/component/${componentId}`
    );
  }

  static async addMember(trainingId: string, body: UserId) {
    return api.patch<void>(`/training/${trainingId}/member`, body);
  }

  static async removeMember(trainingId: string, body: UserId) {
    return api.delete<void>(`/training/${trainingId}/member`, { body });
  }
}
