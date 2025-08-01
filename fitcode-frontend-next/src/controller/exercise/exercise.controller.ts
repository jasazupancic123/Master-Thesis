import { CommonService } from '@/common/service/common.service';
import {
  CreateExercise,
  CreateExercises,
  Exercise,
  FilterExercises,
  UpdateExercise,
} from './type/exercise.type';

const api = CommonService.instance.api;

export class ExerciseController {
  static async findAllGlobal(token?: string, query?: FilterExercises) {
    return api.get<Exercise[]>('/exercise/global', {
      token,
      query,
    });
  }

  static async findAllByInstitution(
    institutionId: string,
    query?: FilterExercises
  ) {
    return api.get<Exercise[]>(`/exercise/institution/${institutionId}`, {
      query,
    });
  }

  static async create(body: CreateExercise) {
    return api.post<Exercise>(`/exercise`, body);
  }

  static async createMany(body: CreateExercises) {
    return api.post<Exercise[]>(`/exercise/many`, body);
  }

  static async update(exerciseId: string, body: UpdateExercise) {
    return api.patch<Exercise>(`/exercise/${exerciseId}`, body);
  }

  static async delete(exerciseId: string) {
    return api.delete<{}>(`/exercise/${exerciseId}`);
  }
}
