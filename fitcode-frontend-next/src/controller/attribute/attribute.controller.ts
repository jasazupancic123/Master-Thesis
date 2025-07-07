import { CommonService } from '@/common/service/common.service';
import { Attribute } from './type/attribute.type';
import { ONE_HOUR_IN_MS } from '@/common/constant/time.constant';

const api = CommonService.instance.api;

export class AttributeController {
  static async findAll() {
    return api.get<Attribute[]>('/attribute', {});
  }
}
