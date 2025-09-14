import { BaseController } from '../base.controller';
import type { Profile, UpdateProfile } from './type/user.type';
import type {
  CreateWellness,
  Wellness,
  WellnessZScore,
} from './type/wellness.type';

export class ProfileController extends BaseController {
  private static instance: ProfileController;

  private constructor() {
    super('/profile');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new ProfileController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findProfile() {
    return this.api.get<Profile>('/', {
      token: this.getToken(),
    });
  }

  async update(input: UpdateProfile) {
    return this.api.patch<object>('/', input, {
      token: this.getToken(),
    });
  }

  async upsertWellness(body: CreateWellness) {
    return this.api.post<Wellness>('/', body, {
      token: this.getToken(),
    });
  }

  async getLatestWellnessByUser() {
    return this.api.get<Wellness>('/wellness', { token: this.getToken() });
  }

  async getWellnessByInstitution(institutionId: string) {
    return this.api.get<WellnessZScore[]>(
      `/wellness/institution/${institutionId}`,
      { token: this.getToken() }
    );
  }
}
