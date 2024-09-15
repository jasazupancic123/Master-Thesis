import { FilterUserQuery } from '@/user/type/filter-user-query.type';
import { CommonService } from '@/common/service/common.service';
import { User } from '@/user/type/user.type';
import { CustomClaims } from '@/user/type/custom-claims.type';
import { Wellness } from '@/user/entity/wellness.entity';
import { CreateWellness } from '@/user/type/wellness.type';

const commonService = CommonService.instance;

export class UserController {
  static URL = {
    users: (filter?: FilterUserQuery) => {
      const query = {
        ...(filter?.ids && { ids: filter.ids.join(',') }),
        ...(filter?.emails && { emails: filter.emails.join(',') }),
      };

      return `/user${commonService.api.query(query)}`;
    },
    userById: (id: string) => `/user/${id}`,
    me: () => '/user/me',
    customClaims: (id: string) => `/user/${id}/claims`,
    wellness: () => `/user/me/wellness`,
  };

  static async findAll(filter?: FilterUserQuery): Promise<User[]> {
    return await commonService.api.fetch<User[]>(this.URL.users(filter));
  }

  static async findMe(): Promise<User> {
    return await commonService.api.fetch<User>(this.URL.me());
  }

  static async findOneById(id: string): Promise<User> {
    return await commonService.api.fetch<User>(this.URL.userById(id));
  }

  static async updateUserClaims(uid: string, claims: Partial<CustomClaims>): Promise<void> {
    await commonService.api.fetch(this.URL.customClaims(uid), { method: 'PATCH', body: claims });
  }

  static async getTodayWellness(token: string): Promise<Wellness> {
    return await commonService.api.fetch<Wellness>(this.URL.wellness(), { token });
  }

  static async submitWellness(token: string, data: CreateWellness): Promise<void> {
    await commonService.api.fetch(this.URL.wellness(), { method: 'POST', token, body: data });
  }
}