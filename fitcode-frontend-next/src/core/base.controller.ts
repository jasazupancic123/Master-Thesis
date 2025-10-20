import { BACKEND_API_BASE_URL } from '@/core/const/api.const';
import { FetchUtil } from '@/lib/common/service/fetch.util';

export class BaseController {
  protected api: FetchUtil;
  private sessionToken?: string;

  protected constructor(url: string) {
    this.api = new FetchUtil(`${BACKEND_API_BASE_URL}${url}`);
    return this;
  }

  getSessionToken() {
    return this.sessionToken;
  }

  setSessionToken(token: string) {
    this.sessionToken = token;
  }
}
