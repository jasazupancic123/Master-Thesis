import { CommonService } from '@/common/service/common.service';
import { Cycle } from './type/cycle.type';
import { Group } from './type/group.type';

const api = CommonService.instance.api;

export class GroupController {
  static async findAll(token: string) {
    return api.get<Group[]>('/group', { token });
  }

  static async findById(token: string, groupId: string) {
    return api.get<Group>(`/group/${groupId}`, { token });
  }

  static async create(
    token: string,
    body: { name: string; membersIds: string[] }
  ) {
    return api.post<Group>('/group', body, { token });
  }

  static async update(
    token: string,
    groupId: string,
    body: { name?: string; membersIds?: string[]; cycles?: Cycle[] }
  ) {
    return api.patch<Group>(`/group/${groupId}`, body, { token });
  }

  static async delete(token: string, groupId: string) {
    return api.delete<{}>(`/group/${groupId}`, { token });
  }
}
