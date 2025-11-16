import { BaseController } from '../base.controller';
import type { ExerciseAiPrescription } from '@/core/exercise-ai-prescriptions/type/exercise-detection-data';

export class ExerciseAiPrescriptionsController extends BaseController {
  private static instance: ExerciseAiPrescriptionsController;

  private constructor() {
    super('/exercise-ai-prescriptions');
  }

  static getInstance() {
    if (!this.instance) this.instance = new ExerciseAiPrescriptionsController();
    return this.instance;
  }

  async findAll() {
    return await this.api.get<ExerciseAiPrescription[]>('/');
  }

  async upsertMany(body: ExerciseAiPrescription[]) {
    return await this.api.post<ExerciseAiPrescription[]>('/upsert-many', body);
  }
}
