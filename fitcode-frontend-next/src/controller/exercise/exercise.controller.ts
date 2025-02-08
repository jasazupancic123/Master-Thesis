import { CommonService } from '@/common/service/common.service';
import { ExerciseAttribute } from './type/exercise-attribute.type';
import { Exercise } from './type/exercise.type';

const api = CommonService.instance.api;

export class ExerciseController {
  static async findAttributes() {
    return api.get<ExerciseAttribute[]>('/exercise/attribute');
  }

  static async findAll(token: string) {
    return api.get<Exercise[]>('/exercise', { token });
  }

  static async findById(token: string, exerciseId: string) {
    return api.get<Exercise>(`/exercise/${exerciseId}`, { token });
  }

  static async create(
    token: string,
    body: {
      name: string;
      componentsIds: string[];
      imageUrl?: string;
      videoUrl?: string;
      attributeValues: Record<string, any>;
    }
  ) {
    return api.post<Exercise>(`/exercise`, { token, body });
  }

  static async update(
    token: string,
    exerciseId: string,
    body: {
      name: string;
      componentsIds: string[];
      imageUrl?: string;
      videoUrl?: string;
      attributeValues: Record<string, any>;
    }
  ) {
    return api.patch<Exercise>(`/exercise/${exerciseId}`, { token, body });
  }

  static async delete(token: string, exerciseId: string) {
    return api.delete<{}>(`/exercise/${exerciseId}`, { token });
  }
}
