import { BaseController } from '../base.controller';
import type { Component } from './type/component.type';

export class ComponentController extends BaseController {
  private static instance: ComponentController;

  private constructor() {
    super('/component');
  }

  static getInstance() {
    if (!this.instance) this.instance = new ComponentController();
    return this.instance;
  }

  async findAll() {
    return await this.api.get<Component[]>('/');
  }
}
