import { BaseController } from '../base.controller';
import type { ExerciseAiPrescription } from '@/core/exercise-ai-prescriptions/type/exercise-detection-data';
import type { FetchOptions } from '@/lib/common/type/api.type';

export class ExerciseAiPrescriptionsController extends BaseController {
  private static instance: ExerciseAiPrescriptionsController;

  private constructor() {
    super('/exercise-ai-prescriptions');
  }

  static getInstance() {
    if (!this.instance) this.instance = new ExerciseAiPrescriptionsController();
    return this.instance;
  }

  async findAll(options?: FetchOptions) {
    return await this.api.get<ExerciseAiPrescription[]>('/', options);
  }

  async upsertMany(body: ExerciseAiPrescription[]) {
    return await this.api.post<ExerciseAiPrescription[]>('/upsert-many', body);
  }
}
