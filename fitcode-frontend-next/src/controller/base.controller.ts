import { getFirebaseAuth } from '@/common/config/firebase.config';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { ApiUtil } from '@/common/service/util/api.util';

export class BaseController {
  private token: string | undefined;
  protected api: ApiUtil;

  protected constructor(url: string) {
    this.api = new ApiUtil(`${BACKEND_API_BASE_URL}${url}`);
    return this;
  }

  static async getFreshIdToken(): Promise<string | null> {
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;

    return await user.getIdToken(true); // true = force refresh if expired
  }

  protected getToken(): string | undefined {
    return this.token;
  }

  public setToken(token: string) {
    this.token = token;
    return this;
  }
}
