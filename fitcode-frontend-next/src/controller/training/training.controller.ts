import { CommonService } from '@/common/service/common.service';
import { DateRange } from '@/common/type/date-range.type';
import { Superset } from './type/superset.type';
import { TrainingComponent } from './type/training-component.type';
import { Training } from './type/training.type';
import { Workload } from './type/workload.type';
import { CompletedFutureWorkloads } from './type/completed-future-workloads.type';
import { PeriodizationType } from './enum/periodization-type.enum';
import { TrainingInfo } from './type/training.type';
import { TrainingExerciseAverageStats } from './type/training-exercise-average-stats.type';
import { CompletedTrainingComponent } from './type/completed-training.entity';

const api = CommonService.instance.api;

export class TrainingController {
  static async findAll(
    query?: DateRange & {
      groupId?: string;
      cycleId?: string;
      minimal?: number; // cannot be boolean, so just use number
    }
  ) {
    return api.get<Training[] | TrainingInfo[]>('/training', {
      query,
    });
  }

  static async findByDay(day: Date, groupId: string) {
    return api.post<Training[]>(`/training/${groupId}/day`, { day });
  }

  static async findByDayAndPeriod(
    day: Date,
    period: 'AM' | 'PM',
    groupId: string
  ) {
    return api.post<{ training: Training | null }>(
      `/training/${groupId}/day-period`,
      { day, period }
    );
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

  static async create(body: {
    groupId: string;
    cycleId: string;
    components: TrainingComponent[];
    membersIds: string[];
    copiedFromId?: string;
    stats: TrainingExerciseAverageStats[];
    futureStats: TrainingExerciseAverageStats[];
  }): Promise<Training> {
    return api.post<Training>('/training', body);
  }

  static async copyComponent(
    body: Pick<DateRange, 'from'> & {
      copyFromTrainingId: string;
      copyToTrainingId?: string;
      componentId: string;
    }
  ) {
    return api.post<Training>('/training/copy/component', body);
  }

  static async periodize(body: {
    baseTrainingId: string;
    componentId: string;
    periodizationType: PeriodizationType;
    exerciseIds: string[];
    subgroupId?: string;
  }) {
    return api.post<Training[]>('/training/periodize/trainings', body);
  }

  static async update(
    trainingId: string,
    body: DateRange & {
      components: TrainingComponent[];
      membersIds: string[];
      warmup: TrainingComponent;
      cooldown: TrainingComponent;
      workloads: Workload[];
    }
  ) {
    return api.patch<Training>(`/training/${trainingId}`, body);
  }

  static async copy(
    trainingId: string,
    body: { from: string; to: string; membersIds?: string[] }
  ) {
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
