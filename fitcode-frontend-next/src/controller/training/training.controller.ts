import { CommonService } from '@/common/service/common.service';
import { Training } from './type/training.type';
import { ExerciseMeta, TrainingPlan } from './type/training-plan.type';
import { DateRange } from '@/common/type/date-range.type';
import { SetData } from './type/set-data';

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
    body: Required<DateRange> & {
      groupId: string;
      cycleId: string;
      components: TrainingPlan;
    }
  ) {
    return api.post<Training>('/training', body, { token });
  }

  static async update(
    token: string,
    trainingId: string,
    body: DateRange & { components: TrainingPlan }
  ) {
    return api.patch<Training>(`/training/${trainingId}`, body, { token });
  }

  static async delete(token: string, trainingId: string) {
    return api.delete<{}>(`/training/${trainingId}`, { token });
  }

  static async addSubgroup(
    token: string,
    trainingId: string,
    body: { name: string; membersIds: string[] }
  ) {
    return api.post<Training>(`/training/${trainingId}/subgroup`, body, {
      token,
    });
  }

  static async updateSubgroup(
    token: string,
    trainingId: string,
    subgroupId: string,
    body: { name: string; membersIds: string[] }
  ) {
    return api.patch<Training>(
      `/training/${trainingId}/subgroup/${subgroupId}`,
      body,
      { token }
    );
  }

  static async deleteSubgroup(
    token: string,
    trainingId: string,
    subgroupId: string
  ) {
    return api.delete<Training>(
      `/training/${trainingId}/subgroup/${subgroupId}`,
      { token }
    );
  }

  static async addComponents(
    token: string,
    trainingId: string,
    body: {
      subgroupId?: string;
      components: {
        id: string;
        order: number;
        color?: string;
      }[];
    }
  ) {
    return api.post<Training>(`/training/${trainingId}/component`, body, {
      token,
    });
  }

  static async updateComponent(
    token: string,
    trainingId: string,
    componentId: string,
    body: {
      subgroupId?: string;
      order: number;
      color?: string;
    }
  ) {
    return api.patch<Training>(
      `/training/${trainingId}/component/${componentId}`,
      body,
      { token }
    );
  }

  static async deleteComponent(
    token: string,
    trainingId: string,
    componentId: string,
    body: { subgroupId?: string }
  ) {
    return api.delete<Training>(
      `/training/${trainingId}/component/${componentId}`,
      { token, body }
    );
  }

  static async addSuperset(
    token: string,
    trainingId: string,
    componentId: string,
    body: { subgroupId?: string; color?: string }
  ) {
    return api.post<Training>(
      `/training/${trainingId}/component/${componentId}`,
      body,
      { token }
    );
  }

  static async updateSuperset(
    token: string,
    trainingId: string,
    componentId: string,
    superset: number,
    body: { subgroupId?: string; order: number; color?: string }
  ) {
    return api.patch<Training>(
      `/training/${trainingId}/component/${componentId}/superset/${superset}`,
      body,
      { token }
    );
  }

  static async deleteSuperset(
    token: string,
    trainingId: string,
    componentId: string,
    superset: number,
    body: { subgroupId?: string }
  ) {
    return api.delete<Training>(
      `/training/${trainingId}/component/${componentId}/superset/${superset}`,
      { token, body }
    );
  }

  static async addExercises(
    token: string,
    trainingId: string,
    componentId: string,
    superset: number,
    body: {
      subgroupId?: string;
      exercises: {
        id: string;
        meta: ExerciseMeta;
        color?: string;
      }[];
    }
  ) {
    return api.post<Training>(
      `/training/${trainingId}/component/${componentId}/superset/${superset}`,
      body,
      { token }
    );
  }

  static async updateExercise(
    token: string,
    trainingId: string,
    componentId: string,
    superset: number,
    exerciseId: string,
    body: {
      subgroupId?: string;
      meta?: ExerciseMeta;
      color?: string;
      order?: number;
    }
  ) {
    return api.patch<Training>(
      `/training/${trainingId}/component/${componentId}/superset/${superset}/exercise/${exerciseId}`,
      body,
      { token }
    );
  }

  static async deleteExercise(
    token: string,
    trainingId: string,
    componentId: string,
    superset: number,
    exerciseId: string,
    body: { subgroupId?: string }
  ) {
    return api.delete<Training>(
      `/training/${trainingId}/component/${componentId}/superset/${superset}/exercise/${exerciseId}`,
      { token, body }
    );
  }

  static async updateAthleteWorkload(
    token: string,
    trainingId: string,
    componentId: string,
    superset: number,
    exerciseId: string,
    body: {
      subgroupId?: string;
      sets: SetData[];
    }
  ) {
    return api.patch<{}>(
      `/training/${trainingId}/component/${componentId}/superset/${superset}/exercise/${exerciseId}`,
      body,
      { token }
    );
  }
}
