import { BaseController } from './base.controller';
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
    console.log('AppController.init');
    return this.api.get<MainProviderProps>('/init', { token: this.getToken() });
  }
}
