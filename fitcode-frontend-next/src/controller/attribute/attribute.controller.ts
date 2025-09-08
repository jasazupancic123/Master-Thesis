import { BaseController } from '../base.controller';
import type { Attribute } from './type/attribute.type';

export class AttributeController extends BaseController {
  private static instance: AttributeController;

  private constructor() {
    super('/attribute');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new AttributeController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findAll() {
    return this.api.get<Attribute[]>('/', { token: this.getToken() });
  }
}
