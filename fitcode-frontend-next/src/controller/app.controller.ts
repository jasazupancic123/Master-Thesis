import { BaseController } from './base.controller';
import { ExerciseService } from './exercise/exercise.service';
import type { MainProviderProps } from '@/store/main.provider';

export class AppController extends BaseController {
  private static instance: AppController;

  private constructor() {
    super('');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new AppController();
    this.instance.setToken(token);
    return this.instance;
  }

  async init() {
    const data = await this.api.get<MainProviderProps>('/init', {
      token: this.getToken(),
    });

    data.exercises = data.exercises.map((e) =>
      ExerciseService.mapComponents(e, data.components)
    );

    return data;
  }
}
