import { BaseController } from './base.controller';
import { ExerciseService } from './exercise/exercise.service';
import type { FetchOptions } from '@/common/type/api.type';
import type { MainProviderProps } from '@/store/main.provider';

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
    const data = await this.api.get<MainProviderProps>('/init', options);

    data.exercises = data.exercises.map((e) =>
      ExerciseService.mapComponents(e, data.components)
    );

    return data;
  }
}
