import { CommonService } from '@/common/service/common.service';
import { UserRole } from './enum/user-role.enum';
import { Wellness } from './type/wellness.type';
import { User, UserEntity } from './type/user.type';

const api = CommonService.instance.api;

export class UserController {
  static async findAll(token?: string, query?: { ids?: string[]; emails?: string[] }) {
    return api.get<User[]>('/user', { token, query });
  }

  static async findMe(token?: string) {
    return api.get<User>('/user/me', { token });
  }

  static async findProfile() {
    return api.get<UserEntity>('/user/me/profile');
  }

  static async findById(id: string) {
    return api.get<User>(`/user/${id}`);
  }

  static async updateClaims(id: string, input: { role: UserRole[] }) {
    return api.patch<{}>(`/user/${id}`, input);
  }

  static async updateProfile(input: Partial<UserEntity>) {
    return api.patch<{}>('/user/me/profile', input);
  }

  static async getMyMeta() {
    return api.get<Wellness>('/user/me/meta');
  }

  static async saveMeta(body: Omit<Wellness, 'userId'>) {
    return api.post<Wellness>('/user/me/meta', body);
  }

  static async addAthlete(input: {
    email: string;
    displayName: string;
    password: string;
  }) {
    return api.post<User>('/user/athlete/add', input);
  }
}
