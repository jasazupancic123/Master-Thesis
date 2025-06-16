import { CommonService } from '@/common/service/common.service';
import { DateRange } from '@/common/type/date-range.type';
import { Superset, TrainingComponent } from './type/training-plan.type';
import { Training, TrainingStatus } from './type/training.type';
import { Workload } from './type/workload.type';
import { CompletedFutureWorkloads } from './type/completed-future-workloads.type';
import { GroupWorkloadStats } from './type/average-workload-values.type';

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

  static async findByIdAndPopulateAthleteWorkloads(
    token: string,
    trainingId: string,
    componentId: string,
    userId: string
  ) {
    return api.get<Training>(
      `/training/${trainingId}/component/${componentId}`,
      { token }
    );
  }

  static async findAthleteGroupWorkloads(
    token: string,
    groupId: string,
    exerciseIds: string[],
    userId: string
  ) {
    return api.post<CompletedFutureWorkloads>(
      `/training/group/${groupId}/athlete/${userId}/workloads`,
      { exerciseIds },
      { token }
    );
  }

  static async create(
    token: string,
    body: {
      groupId: string;
      cycleId: string;
      components: TrainingComponent[];
      membersIds: string[];
      copiedFromId?: string;
      stats: GroupWorkloadStats[];
      futureStats: GroupWorkloadStats[];
    }
  ) {
    return api.post<Training>('/training', body, { token });
  }

  static async update(
    token: string,
    trainingId: string,
    body: Partial<
      DateRange & {
        components: TrainingComponent[];
        warmup: TrainingComponent;
        cooldown: TrainingComponent;
      }
    >
  ) {
    return api.patch<Training>(`/training/${trainingId}`, body, { token });
  }

  static async batchUpdate(
    token: string,
    params: { groupId: string; cycleId: string },
    body: {
      id: string;
      components: TrainingComponent[];
      membersIds: string[];
      warmup: TrainingComponent;
      cooldown: TrainingComponent;
      futureStats: GroupWorkloadStats[];
    }[],
    customAthleteWorkloads: Workload[]
  ) {
    console.log('body:', body);
    const { groupId, cycleId } = params;
    return api.patch<Training[]>(
      `/training/batch/group/${groupId}/cycle/${cycleId}`,
      { trainings: body, customAthleteWorkloads },
      { token }
    );
  }

  static async copy(
    token: string,
    trainingId: string,
    body: { from: string; to: string; membersIds?: string[] }
  ) {
    return api.post<Training>(`/training/${trainingId}/copy`, body, { token });
  }

  static async copyComponent(
    token: string,
    trainingId: string,
    body: {
      trainingComponent: TrainingComponent;
      copiedFromTrainingId: string;
      overwrite?: boolean;
    }
  ) {
    return api.patch<Training>(`/training/${trainingId}/component/copy`, body, {
      token,
    });
  }

  static async createWithTrainingComponent(
    token: string,
    trainingId: string,
    body: { trainingComponent: TrainingComponent; date: DateRange }
  ) {
    return api.post<Training>(`/training/${trainingId}/withComponent`, body, {
      token,
    });
  }

  static async delete(token: string, trainingId: string) {
    await api.delete<{}>(`/training/${trainingId}`, { token });
    return null;
  }

  static async getTrainingStatus(token: string, trainingId: string) {
    return api.get<TrainingStatus[]>(`/training/${trainingId}/status`, {
      token,
    });
  }

  static async finishComponent(
    token: string,
    trainingId: string,
    userId: string,
    componentId: string,
    rootComponentId: string,
    supersets: Superset[]
  ): Promise<Training> {
    return api.patch<Training>(
      `/training/${trainingId}/finish/${componentId}/component`,
      { userId, rootComponentId, supersets },
      {
        token,
      }
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
