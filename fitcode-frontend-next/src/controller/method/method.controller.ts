import { BaseController } from '../base.controller';
import type { Method } from './type/method.type';

export class MethodController extends BaseController {
  private static instance: MethodController;

  private constructor() {
    super('/method');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new MethodController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findAll(): Promise<Method[]> {
    return this.api.get('/', { token: this.getToken() });
  }

  async findById(id: string): Promise<Method> {
    return this.api.get(`/${id}`, { token: this.getToken() });
  }

  async create(body: Method): Promise<Method> {
    return this.api.post<Method>('/', body, { token: this.getToken() });
  }
}
