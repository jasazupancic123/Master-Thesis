import { BaseController } from '../base.controller';
import type {
  CreateUser,
  ImportUsers,
  UpdateUser,
  User,
} from './type/user.type';
import type { CreateWellness, Wellness } from './type/wellness.type';
import type { FetchOptions } from '@/lib/common/type/api.type';
import type { ValidateRowError } from '@/lib/common/type/validate-row-error.type';

export class UserController extends BaseController {
  private static instance: UserController;

  private constructor() {
    super('/user');
  }

  static getInstance() {
    if (!this.instance) this.instance = new UserController();
    return this.instance;
  }

  async import(input: ImportUsers) {
    return this.api.post<{
      successful: User[];
      errors: ValidateRowError[];
    }>('/import', input);
  }

  async update(uid: string, input: UpdateUser) {
    return this.api.patch<object>(`/${uid}`, input);
  }

  async register(input: CreateUser, options?: FetchOptions) {
    return this.api.post<User>('/register', input, options);
  }

  async saveFaceEmbeddings(faceEmbedding: number[]) {
    return this.api.post<object>('/embed', { faceEmbedding });
  }

  async upsertWellness(body: CreateWellness) {
    return this.api.post<Wellness>('/wellness', body);
  }
}
