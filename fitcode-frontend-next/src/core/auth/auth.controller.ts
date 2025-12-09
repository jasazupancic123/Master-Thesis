import { BaseController } from '../base.controller';
import type { User } from '../user/type/user.type';
import type { FetchOptions } from '@/lib/common/type/api.type';

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
    return this.api.post<User | null>('/session-login', { idToken }, options);
  }

  async logout(options?: FetchOptions) {
    return this.api.post('/logout', {}, options);
  }

  async verifyLink(token: string, options?: FetchOptions) {
    return this.api.post<{ token: string; redirect?: string }>(
      '/link/verify',
      { token },
      options
    );
  }
}
