import { CommonService } from '@/common/service/common.service';
import { Component } from './type/component.type';

const api = CommonService.instance.api;

export class ComponentController {
  static async findAll() {
    return await api.get<Component[]>('/component');
  }
}
