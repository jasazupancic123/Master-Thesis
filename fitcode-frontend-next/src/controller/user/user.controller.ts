import { CommonService } from '@/common/service/common.service';
import { UserRole } from './enum/user-role.enum';
import { UserMeta } from './type/user-meta.type';
import { User, UserEntity } from './type/user.type';

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

  static async findMe(token: string) {
    return api.get<User>(`/user/me`, { token });
  }

  static async findById(token: string, id: string) {
    return api.get<User>(`/user/${id}`, { token });
  }

  static async updateClaims(
    token: string,
    id: string,
    input: { role: UserRole[] }
  ) {
    return api.patch<{}>(`/user/${id}`, input, { token });
  }

  static async updateProfile(token: string, input: Partial<UserEntity>) {
    return api.patch<{}>('/user/me/profile', input, { token });
  }

  static async getMyMeta(token: string) {
    return api.get<UserMeta>('/user/me/meta', { token });
  }

  static async saveMeta(token: string, body: Omit<UserMeta, 'userId'>) {
    return api.post<UserMeta>('/user/me/meta', body, { token });
  }

  static async addAthlete(
    token: string,
    input: { email: string; displayName: string; password: string }
  ) {
    return api.post<User>('/user/athlete/add', input, { token });
  }
}
