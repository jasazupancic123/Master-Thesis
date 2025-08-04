import type { Attribute } from './type/attribute.type';
import { CommonService } from '@/common/service/common.service';

const api = CommonService.instance.api;

export class AttributeController {
  static async findAll() {
    return api.get<Attribute[]>('/attribute', {});
  }
}
