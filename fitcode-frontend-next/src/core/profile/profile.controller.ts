import type { AuthUser } from '../auth/type/user.type';
import { BaseController } from '../base.controller';
import type { ImportProfiles, Profile, UpdateProfile } from './type/user.type';
import type {
  CreateWellness,
  Wellness,
  WellnessZScore,
} from './type/wellness.type';
import type { FetchOptions } from '@/lib/common/type/api.type';
import type { ValidateRowError } from '@/lib/common/type/validate-row-error.type';

export class ProfileController extends BaseController {
  private static instance: ProfileController;

  private constructor() {
    super('/profile');
  }

  static getInstance() {
    if (!this.instance) this.instance = new ProfileController();
    return this.instance;
  }

  async importProfiles(input: ImportProfiles) {
    return this.api.post<{
      successful: AuthUser[];
      errors: ValidateRowError[];
    }>('/import', input);
  }

  async findProfile() {
    return this.api.get<Profile>('/');
  }

  async update(input: UpdateProfile) {
    return this.api.patch<object>('/', input);
  }

  async upsertWellness(body: CreateWellness) {
    return this.api.post<Wellness>('/', body);
  }

  async getLatestWellnessByUser() {
    return this.api.get<Wellness>('/wellness');
  }

  async getWellnessByInstitution(
    institutionId: string,
    options?: FetchOptions
  ) {
    return this.api.get<WellnessZScore[]>(
      `/wellness/institution/${institutionId}`,
      options
    );
  }
}
