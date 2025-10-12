import { BaseController } from '../base.controller';
import type { CustomClaims } from './type/custom-claims.type';
import type { FilterUsers } from './type/filter-user-query.type';
import type { AuthUser, CreateUser, UpdateUser } from './type/user.type';
import type { FetchOptions } from '@/common/type/api.type';

export class AuthController extends BaseController {
  private static instance: AuthController;

  private constructor() {
    super('/auth');
  }

  static getInstance() {
    if (!this.instance) this.instance = new AuthController();
    return this.instance;
  }

  async sessionLogin(idToken: string, options?: FetchOptions) {
    return this.api.post<AuthUser | null>(
      '/session-login',
      { idToken },
      options
    );
  }

  async logout(options?: FetchOptions) {
    return this.api.post('/logout', {}, options);
  }

  async findAll(query?: FilterUsers, options?: FetchOptions) {
    return this.api.get<AuthUser[]>('/', { query, ...options });
  }

  async findMe(options?: FetchOptions) {
    return this.api.get<AuthUser>('/me', options);
  }

  async findById(id: string, options?: FetchOptions) {
    return this.api.get<AuthUser>(`/${id}`, options);
  }

  async updateUser(id: string, input: UpdateUser, options?: FetchOptions) {
    return this.api.patch(`/${id}`, input, options);
  }

  async updateCustomClaims(
    id: string,
    input: CustomClaims,
    options?: FetchOptions
  ) {
    return this.api.patch<object>(`/${id}/claims`, input, options);
  }

  async registerAthlete(input: CreateUser, options?: FetchOptions) {
    return this.api.post<AuthUser>('/athlete/register', input, options);
  }
}
