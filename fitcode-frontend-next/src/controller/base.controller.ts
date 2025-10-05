import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { ApiUtil } from '@/common/service/util/api.util';

export class BaseController {
  protected api: ApiUtil;
  private sessionToken?: string;

  protected constructor(url: string) {
    this.api = new ApiUtil(`${BACKEND_API_BASE_URL}${url}`);
    return this;
  }

  getSessionToken() {
    return this.sessionToken;
  }

  setSessionToken(token: string) {
    this.sessionToken = token;
  }
}
