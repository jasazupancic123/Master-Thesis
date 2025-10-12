import { BaseController } from '../base.controller';
import type { Method } from './type/method.type';

export class MethodController extends BaseController {
  private static instance: MethodController;

  private constructor() {
    super('/method');
  }

  static getInstance() {
    if (!this.instance) this.instance = new MethodController();
    return this.instance;
  }

  async findAll(): Promise<Method[]> {
    return this.api.get('/');
  }

  async findById(id: string): Promise<Method> {
    return this.api.get(`/${id}`);
  }

  async create(body: Method): Promise<Method> {
    return this.api.post<Method>('/', body);
  }
}
