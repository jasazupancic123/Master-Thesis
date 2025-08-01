import { CommonService } from '@/common/service/common.service';
import { DateRange } from '@/common/type/date-range.type';
import {
  CopyComponent,
  TrainingComponent,
} from './type/training-component.type';
import {
  CopyTraining,
  CreateTraining,
  FilterTrainings,
  PeriodizeTrainings,
  Training,
  UpdateTraining,
} from './type/training.type';
import { Workload } from './type/workload.type';
import { CompletedFutureWorkloads } from './type/completed-future-workloads.type';
import { PeriodizationType } from './enum/periodization-type.enum';
import { CompletedTrainingComponent } from './type/completed-training.entity';

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

  static async findAthleteWorkloads(trainingId: string, userId: string) {
    return api.get<CompletedFutureWorkloads>(
      `/training/${trainingId}/athlete/${userId}/workloads`
    );
  }

  static async create(body: CreateTraining): Promise<Training> {
    return api.post<Training>('/training', body);
  }

  static async copyComponent(body: CopyComponent) {
    return api.post<Training>('/training/copy/component', body);
  }

  static async periodize(body: PeriodizeTrainings) {
    return api.post<Training[]>('/training/periodize/trainings', body);
  }

  static async update(trainingId: string, body: UpdateTraining) {
    return api.patch<Training>(`/training/${trainingId}`, body);
  }

  static async copy(trainingId: string, body: CopyTraining) {
    return api.post<Training>(`/training/${trainingId}/copy`, body);
  }

  static async delete(trainingId: string) {
    await api.delete<{}>(`/training/${trainingId}`);
    return null;
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
}
