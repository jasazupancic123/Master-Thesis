import { CommonService } from '@/common/service/common.service';
import { DateRange } from '@/common/type/date-range.type';
import { Superset, TrainingComponent } from './type/training-plan.type';
import { Training, TrainingStatus } from './type/training.type';
import { Workload } from './type/workload.type';
import { CompletedFutureWorkloads } from './type/completed-future-workloads.type';
import { AverageWorkloadValues } from './type/average-workload-values.type';
import { PeriodizationType } from '../group/enum/periodization-type.enum';

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
      {
        token,
      }
    );
  }

  static async getUserWorkloadsByGroupIdAndExerciseIds(
    token: string,
    groupId: string,
    exerciseIds: string[],
    userId: string
  ) {
    return api.post<CompletedFutureWorkloads>(
      `/training/${groupId}/${userId}/workloads`,
      { exerciseIds },
      {
        token,
      }
    );
  }

  static async create(
    token: string,
    body: {
      training: {
        groupId: string;
        cycleId: string;
        components: TrainingComponent[];
      };
      copyFromTrainingId?: string;
      date?: { from: Date; to: Date };
    }
  ): Promise<Training> {
    return api.post<Training>('/training', body, { token });
  }

  static async periodizeTrainings(
    token: string,
    body: {
      baseTrainingId: string;
      excludedTrainingIds: string[];
      componentId: string;
      exerciseIds: string[];
      periodizationType: PeriodizationType;
    }
  ) {
    return api.post<Training[]>('/training/periodize/trainings', body, {
      token,
    });
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
      avgFutureWorkloadValues: AverageWorkloadValues[];
    }[],
    customAthleteWorkloads: Workload[]
  ) {
    const { groupId, cycleId } = params;
    return api.patch<Training[]>(
      `/training/batch/${groupId}/${cycleId}`,
      { trainings: body, customAthleteWorkloads },
      { token }
    );
  }

  static async copy(
    token: string,
    trainingId: string,
    body: { from: string; to: string }
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
        | 'volWork1ValueL'
        | 'volWork1ValueR'
        | 'volWork2ValueL'
        | 'volWork2ValueR'
        | 'volRecValueL'
        | 'volRecValueR'
        | 'intWork1ValueL'
        | 'intWork1ValueR'
        | 'intWork2ValueL'
        | 'intWork2ValueR'
        | 'intRecValueL'
        | 'intRecValueR'
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
