import { CommonService } from '@/common/service/common.service';
import { UserRole } from './enum/user-role.enum';
import { Wellness } from './type/wellness.type';
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
    return api.get<User>('/user/me', { token });
  }

  static async findProfile(token: string) {
    return api.get<UserEntity>('/user/me/profile', { token });
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
    return api.get<Wellness>('/user/me/meta', { token });
  }

  static async saveMeta(token: string, body: Omit<Wellness, 'userId'>) {
    return api.post<Wellness>('/user/me/meta', body, { token });
  }

  static async registerUser(
    token: string,
    input: { email: string; displayName: string; password: string, role: UserRole }
  ) {
    return api.post<User>('/user/add/register', input, { token });
  }

  static async addAthlete(
    token: string,
    input: { email: string; displayName: string; password: string }
  ) {
    return api.post<User>('/user/athlete/add', input, { token });
  }
}
