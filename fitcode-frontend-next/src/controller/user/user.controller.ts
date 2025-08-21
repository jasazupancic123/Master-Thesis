import type { CustomClaims } from './type/custom-claims.type';
import type {
  AddAthlete,
  FilterUsers,
  UpdateProfile,
  User,
  UserEntity,
} from './type/user.type';
import type {
  CreateWellness,
  Wellness,
  WellnessZScore,
} from './type/wellness.type';
import { CommonService } from '@/common/service/common.service';

const api = CommonService.instance.api;

export class UserController {
  static async findAll(token?: string, query?: FilterUsers) {
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

  static async updateClaims(id: string, input: CustomClaims) {
    return api.patch<object>(`/user/${id}`, input);
  }

  static async updateProfile(input: UpdateProfile) {
    return api.patch<object>('/user/me/profile', input);
  }

  static async getMyMeta() {
    return api.get<Wellness>('/user/me/meta');
  }

  static async getWellnessByInstitutionId(institutionId: string) {
    return api.get<WellnessZScore[]>(
      `/user/wellness/institution/${institutionId}`
    );
  }

  static async saveMeta(body: CreateWellness) {
    return api.post<Wellness>('/user/me/meta', body);
  }

  static async addAthlete(input: AddAthlete) {
    return api.post<User>('/user/athlete/add', input);
  }
}
