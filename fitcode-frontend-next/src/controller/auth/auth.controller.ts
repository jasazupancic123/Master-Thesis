import { BaseController } from '../base.controller';
import type { CustomClaims } from './type/custom-claims.type';
import type { FilterUsers } from './type/filter-user-query.type';
import type { RegisterAthlete } from './type/register-athlete.type';
import type { AuthUser, UpdateUser } from './type/user.type';

export class AuthController extends BaseController {
  private static instance: AuthController;

  private constructor() {
    super('/auth');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new AuthController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findAll(query?: FilterUsers) {
    return this.api.get<AuthUser[]>('/', { token: this.getToken(), query });
  }

  async findMe() {
    return this.api.get<AuthUser>('/me', { token: this.getToken() });
  }

  async findById(id: string) {
    return this.api.get<AuthUser>(`/${id}`, { token: this.getToken() });
  }

  async updateUser(id: string, input: UpdateUser) {
    return this.api.patch(`/${id}`, input, {
      token: this.getToken(),
    });
  }

  async updateCustomClaims(id: string, input: CustomClaims) {
    return this.api.patch<object>(`/${id}/claims`, input, {
      token: this.getToken(),
    });
  }

  async registerAthlete(input: RegisterAthlete) {
    return this.api.post<AuthUser>('/athlete/register', input, {
      token: this.getToken(),
    });
  }
}
