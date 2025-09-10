import { BaseController } from '../base.controller';
import type {
  CreateExercise,
  Exercise,
  FilterExercises,
  UpdateExercise,
  UpsertManyExercises,
  UpsertManyMuscleValues,
} from './type/exercise.type';

export class ExerciseController extends BaseController {
  private static instance: ExerciseController;

  private constructor() {
    super('/exercise');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new ExerciseController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findAllGlobal(query?: FilterExercises) {
    return this.api.get<Exercise[]>('/global', {
      token: this.getToken(),
      query,
    });
  }

  async findAllByInstitution(institutionId: string, query?: FilterExercises) {
    return this.api.get<Exercise[]>(`/institution/${institutionId}`, {
      query,
      token: this.getToken(),
    });
  }

  async create(body: CreateExercise) {
    return this.api.post<Exercise>(``, body, {
      token: this.getToken(),
    });
  }

  async upsertMany(body: UpsertManyExercises) {
    return this.api.post<Exercise[]>(`/many`, body, {
      token: this.getToken(),
    });
  }

  async upsertManyMuscleValues(body: UpsertManyMuscleValues) {
    return this.api.patch<null>(`/muscle-values/many`, body, {
      token: this.getToken(),
    });
  }

  async update(exerciseId: string, body: UpdateExercise) {
    return this.api.patch<Exercise>(`/${exerciseId}`, body, {
      token: this.getToken(),
    });
  }

  async delete(exerciseId: string) {
    return this.api.delete<null>(`/${exerciseId}`, {
      token: this.getToken(),
    });
  }
}
