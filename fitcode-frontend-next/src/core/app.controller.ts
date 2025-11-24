import { BaseController } from './base.controller';

export class AppController extends BaseController {
  private static instance: AppController;

  private constructor() {
    super('');
  }

  static getInstance() {
    if (!this.instance) this.instance = new AppController();
    return this.instance;
  }
}
