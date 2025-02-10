import { CommonService } from '@/common/service/common.service';
import { Group } from './type/group.type';
import { DateRange } from '@/common/type/date-range.type';
import { Cycle } from './type/cycle.type';

const api = CommonService.instance.api;

export class GroupController {
  static async findAll(token: string) {
    return api.get<Group[]>('/group', { token });
  }

  static async create(
    token: string,
    body: { name: string; membersIds: string[] }
  ) {
    return api.post<Group>('/group', body, { token });
  }

  static async findById(token: string, groupId: string) {
    return api.get<Group>(`/group/${groupId}`, { token });
  }

  static async update(
    token: string,
    groupId: string,
    body: { name?: string; membersIds?: string[] }
  ) {
    return api.patch<Group>(`/group/${groupId}`, body, { token });
  }

  static async delete(token: string, groupId: string) {
    return api.delete<{}>(`/group/${groupId}`, { token });
  }

  static async addCycle(
    token: string,
    groupId: string,
    body: Required<DateRange> & {
      name: string;
      description?: string;
    }
  ) {
    return api.post<Cycle>(`/group/${groupId}/cycle`, body, { token });
  }

  static async updateCycle(
    token: string,
    groupId: string,
    cycleId: string,
    body: DateRange & {
      name?: string;
      description?: string;
    }
  ) {
    return api.patch<Cycle>(`/group/${groupId}/cycle/${cycleId}`, body, {
      token,
    });
  }

  static async deleteCycle(token: string, groupId: string, cycleId: string) {
    return api.delete<{}>(`/group/${groupId}/cycle/${cycleId}`, { token });
  }
}
