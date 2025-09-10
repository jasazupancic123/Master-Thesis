import { BaseController } from '../base.controller';
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

export class UserController extends BaseController {
  private static instance: UserController;

  private constructor() {
    super('/user');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new UserController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findAll(query?: FilterUsers) {
    return this.api.get<User[]>('/', { token: this.getToken(), query });
  }

  async findMe() {
    return this.api.get<User>('/me', { token: this.getToken() });
  }

  async findProfile() {
    return this.api.get<UserEntity>('/me/profile', {
      token: this.getToken(),
    });
  }

  async findById(id: string) {
    return this.api.get<User>(`/${id}`, { token: this.getToken() });
  }

  async updateClaims(id: string, input: CustomClaims) {
    return this.api.patch<object>(`/${id}`, input, {
      token: this.getToken(),
    });
  }

  async updateProfile(input: UpdateProfile) {
    return this.api.patch<object>('/me/profile', input, {
      token: this.getToken(),
    });
  }

  async getMyMeta() {
    return this.api.get<Wellness>('/me/meta', { token: this.getToken() });
  }

  async getWellnessByInstitutionId(institutionId: string) {
    return this.api.get<WellnessZScore[]>(
      `/wellness/institution/${institutionId}`,
      { token: this.getToken() }
    );
  }

  async saveMeta(body: CreateWellness) {
    return this.api.post<Wellness>('/me/meta', body, {
      token: this.getToken(),
    });
  }

  async addAthlete(input: AddAthlete) {
    return this.api.post<User>('/athlete/add', input, {
      token: this.getToken(),
    });
  }
}
