import { CommonService } from '@/common/service/common.service';
import { DateRange } from '@/common/type/date-range.type';
import { TrainingComponent } from './type/training-plan.type';
import { Training } from './type/training.type';
import { Workload } from './type/workload.type';

const api = CommonService.instance.api;

export class TrainingController {
  static async findAll(
    token: string,
    query?: DateRange & {
      groupId?: string;
      cycleId?: string;
    }
  ) {
    return api.get<Training[]>('/training', { token, query });
  }

  static async create(
    token: string,
    body: {
      groupId: string;
      cycleId: string;
      components: TrainingComponent[];
    }
  ) {
    return api.post<Training>('/training', body, { token });
  }

  static async update(
    token: string,
    trainingId: string,
    body: Partial<DateRange & { components: TrainingComponent[] }>
  ) {
    return api.patch<Training>(`/training/${trainingId}`, body, { token });
  }

  static async updateMultiple(
    token: string,
    trainingId: string,
    body: Partial<DateRange & { id: string, components: TrainingComponent[] }>[]
  ) {
    return api.patch<Training[]>(`/training/${trainingId}/multiple`, body, { token });
  }

  static async copy(
    token: string,
    trainingId: string,
    body: { from: string; to: string }
  ) {
    return api.post<Training>(`/training/${trainingId}/copy`, body, { token });
  }

  static async delete(token: string, trainingId: string) {
    await api.delete<{}>(`/training/${trainingId}`, { token });
    return null;
  }

  /* static async getTrainingStatus(token: string, trainingId: string) {
    return api.get<TrainingStatus[]>(`/training/${trainingId}/status`, {
      token,
    });
  } */

  static async updateWorkloads(
    token: string,
    trainingId: string,
    componentId: string,
    body: {
      workloads: Pick<
        Workload,
        | 'userId'
        | 'exerciseId'
        | 'setNumber'
        | 'notes'
        | 'volWork1Value'
        | 'volWork2Value'
        | 'volRecValue'
        | 'intWork1Value'
        | 'intWork2Value'
        | 'intRecValue'
      >[];
    }
  ) {
    return api.patch<{}>(
      `/training/${trainingId}/component/${componentId}`,
      body,
      { token }
    );
  }

  static async addComponents(
    token: string,
    trainingId: string,
    body: { components: TrainingComponent[] }
  ) {
    return api.post<Training>(`/training/${trainingId}/component`, body, {
      token,
    });
  }

  static async deleteComponent(
    token: string,
    trainingId: string,
    componentId: string
  ) {
    return api.delete<Training>(
      `/training/${trainingId}/component/${componentId}`,
      { token }
    );
  }
}
