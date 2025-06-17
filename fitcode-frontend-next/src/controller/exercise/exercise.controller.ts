import { CommonService } from '@/common/service/common.service';
import { Exercise } from './type/exercise.type';
import { ONE_HOUR_IN_MS } from '@/common/constant/time.constant';

const api = CommonService.instance.api;

export class ExerciseController {
  static async findAll(token: string, query?: Record<string, string>) {
    return api.get<Exercise[]>('/exercise', {
      token,
      query,
      cacheTimeInMs: ONE_HOUR_IN_MS,
    });
  }

  static async findById(token: string, exerciseId: string) {
    return api.get<Exercise>(`/exercise/${exerciseId}`, { token });
  }

  static async create(
    token: string,
    body: {
      name: string;
      componentIds: string[];
      imageUrl?: string;
      videoUrl?: string;
      instruction?: string;
      attributeValues: Record<string, any>;
    }
  ) {
    return api.post<Exercise>(`/exercise`, body, { token });
  }

  static async createMany(
    token: string,
    body: {
      exercises: {
        name: string;
        componentIds: string[];
        imageUrl?: string;
        videoUrl?: string;
        instruction?: string;
        attributeValues: Record<string, any>;
      }[];
    }
  ) {
    return api.post<Exercise[]>(`/exercise/many`, body, { token });
  }

  static async update(
    token: string,
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
    return api.patch<Exercise>(`/exercise/${exerciseId}`, body, { token });
  }

  static async delete(token: string, exerciseId: string) {
    return api.delete<{}>(`/exercise/${exerciseId}`, { token });
  }
}
