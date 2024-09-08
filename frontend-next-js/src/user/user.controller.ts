import { FilterUserQuery } from '@/user/type/filter-user-query.type';
import { CommonService } from '@/common/service/common.service';
import { User } from '@/user/type/user.type';

const commonService = CommonService.instance;

export class UserController {
  static async findAll(filter?: FilterUserQuery): Promise<User[]> {
    const query = {
      ...(filter?.ids && { ids: filter.ids.join(',') }),
      ...(filter?.emails && { emails: filter.emails.join(',') }),
    }

    return await commonService.api.fetch<User[]>('/user', { query });
  }

  static async findMe(): Promise<User> {
    return await commonService.api.fetch<User>('/user/me');
  }

  static async findOneById(id: string): Promise<User> {
    return await commonService.api.fetch<User>(`/user/${id}`);
  }
}