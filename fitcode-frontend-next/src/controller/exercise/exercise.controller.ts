import { CommonService } from '@/common/service/common.service';
import { Exercise } from './type/exercise.type';
import { ONE_HOUR_IN_MS } from '@/common/constant/time.constant';

const api = CommonService.instance.api;

export class ExerciseController {
  static async findAllGlobal(token?: string, query?: Record<string, string>) {
    return api.get<Exercise[]>('/exercise/global', {
      token,
      query,
    });
  }

  static async findAllByInstitution(
    institutionId: string,
    query?: Record<string, string>
  ) {
    return api.get<Exercise[]>(`/exercise/institution/${institutionId}`, {
      query,
    });
  }

  static async create(body: {
    name: string;
    componentIds: string[];
    imageUrl?: string;
    videoUrl?: string;
    instruction?: string;
    attributeValues: Record<string, any>;
  }) {
    return api.post<Exercise>(`/exercise`, body);
  }

  static async createMany(body: {
    exercises: {
      name: string;
      componentIds: string[];
      imageUrl?: string;
      videoUrl?: string;
      instruction?: string;
      attributeValues: Record<string, any>;
    }[];
  }) {
    return api.post<Exercise[]>(`/exercise/many`, body);
  }

  static async update(
    exerciseId: string,
    body: {
      name: string;
      componentIds: string[];
      imageUrl?: string;
      videoUrl?: string;
      instruction?: string;
      attributeValues: Record<string, any>;
    }
  ) {
    return api.patch<Exercise>(`/exercise/${exerciseId}`, body);
  }

  static async delete(exerciseId: string) {
    return api.delete<{}>(`/exercise/${exerciseId}`);
  }
}
