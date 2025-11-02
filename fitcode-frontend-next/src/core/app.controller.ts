import { BaseController } from './base.controller';
import type { FetchOptions } from '@/lib/common/type/api.type';
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
    return await this.api.get<MainProviderProps>('/init', options);
  }
}
