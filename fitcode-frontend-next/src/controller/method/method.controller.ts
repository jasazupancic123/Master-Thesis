import { CommonService } from '@/common/service/common.service';
import { Method } from './type/method.type';

const api = CommonService.instance.api;

export class MethodController {
  static async findAll(): Promise<Method[]> {
    return api.get('/method');
  }

  static async findById(id: string): Promise<Method> {
    return api.get(`/method/${id}`);
  }

  static async create(body: Method): Promise<Method> {
    return api.post<Method>('/method', body);
  }
}
