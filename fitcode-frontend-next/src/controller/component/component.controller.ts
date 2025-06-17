import { CommonService } from '@/common/service/common.service';
import { Component } from './type/component.type';
import { ONE_HOUR_IN_MS } from '@/common/constant/time.constant';

const api = CommonService.instance.api;

export class ComponentController {
  static async findAll() {
    return await api.get<Component[]>('/component', {
      cacheTimeInMs: ONE_HOUR_IN_MS,
    });
  }
}
