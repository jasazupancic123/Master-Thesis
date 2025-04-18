import { CommonService } from '@/common/service/common.service';
import { Attribute } from './type/attribute.type';

const api = CommonService.instance.api;

export class AttributeController {
  static async findAll() {
    return api.get<Attribute[]>('/attribute');
  }
}
