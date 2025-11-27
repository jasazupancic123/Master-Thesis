import type { AuthProfileMerged } from './auth/type/user.type';
import { BaseController } from './base.controller';
import type { ExerciseAiPrescription } from './exercise-ai-prescriptions/type/exercise-detection-data';
import type { Institution } from './institution/type/institution.type';
import type { ActiveTraining } from './training/type/training.type';
import type { FetchOptions } from '@/lib/common/type/api.type';

export class AppController extends BaseController {
  private static instance: AppController;

  private constructor() {
    super('');
  }

  static getInstance() {
    if (!this.instance) this.instance = new AppController();
    return this.instance;
  }

  async init(options?: FetchOptions) {
    return this.api.get<{
      profile: AuthProfileMerged;
      institutions: Institution[];
      exerciseAiPrescriptions: ExerciseAiPrescription[];
      activeTraining: ActiveTraining | null;
      globalExercisesRevision: number;
    }>('/init', options);
  }
}
