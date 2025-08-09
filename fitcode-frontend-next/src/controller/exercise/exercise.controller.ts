import type {
  CreateExercise,
  Exercise,
  FilterExercises,
  UpdateExercise,
  UpsertManyExercises,
} from './type/exercise.type';
import { CommonService } from '@/common/service/common.service';

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

  static async upsertMany(body: UpsertManyExercises) {
    return api.post<Exercise[]>(`/exercise/many`, body);
  }

  static async update(exerciseId: string, body: UpdateExercise) {
    return api.patch<Exercise>(`/exercise/${exerciseId}`, body);
  }

  static async delete(exerciseId: string) {
    return api.delete<null>(`/exercise/${exerciseId}`);
  }
}
