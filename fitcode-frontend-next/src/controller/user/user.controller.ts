import { CommonService } from '@/common/service/common.service';
import { User } from '@firebase/auth';
import { UserMeta } from './type/user-meta.type';

const api = CommonService.instance.api;

export class UserController {
  static async findAll(
    token: string,
    query?: {
      ids?: string[];
      emails?: string[];
    }
  ) {
    return api.get<User[]>('/user', { token, query });
  }

  static async findById(token: string, id: string) {
    return api.get<User>(`/user/${id}`, { token });
  }

  static async findMe(token: string) {
    return api.get<User>(`/user/me`, { token });
  }

  static async getMyMeta(token: string) {
    return api.get<UserMeta>('/user/me/meta', { token });
  }

  static async saveMeta(token: string, body: Omit<UserMeta, 'userId'>) {
    return api.post('/user/me/meta', body, { token });
  }
}
