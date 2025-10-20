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

  static getInstance() {
    if (!this.instance) this.instance = new ExerciseController();
    return this.instance;
  }

  async findAllGlobal(_query?: FilterExercises) {
    return this.api.get<Exercise[]>('/global');
  }

  async findAllByInstitution(institutionId: string, _query?: FilterExercises) {
    return this.api.get<Exercise[]>(`/institution/${institutionId}`);
  }

  async create(body: CreateExercise) {
    return this.api.post<Exercise>(``, body, {});
  }

  async upsertMany(body: UpsertManyExercises) {
    return this.api.post<Exercise[]>(`/many`, body, {});
  }

  async upsertManyMuscleValues(body: UpsertManyMuscleValues) {
    return this.api.patch<null>(`/muscle-values/many`, body, {});
  }

  async update(exerciseId: string, body: UpdateExercise) {
    return this.api.patch<Exercise>(`/${exerciseId}`, body, {});
  }

  async delete(exerciseId: string) {
    return this.api.delete<null>(`/${exerciseId}`, {});
  }
}
