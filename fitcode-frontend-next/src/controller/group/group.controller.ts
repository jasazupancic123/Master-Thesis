import type { UserId } from '../institution/type/institution.type';
import type { Cycle } from './type/cycle.type';
import type {
  BatchUpdateGroups,
  CreateGroup,
  Group,
  UpdateGroup,
} from './type/group.type';
import { CommonService } from '@/common/service/common.service';

const api = CommonService.instance.api;

export class GroupController {
  static async findAll() {
    return api.get<Group[]>('/group');
  }

  static async findById(groupId: string, token: string) {
    return api.get<Group>(`/group/${groupId}`, { token });
  }

  static async findAllByInstitution(institutionId: string, token: string) {
    return api.get<Group[]>(`/group/institution/${institutionId}`, { token });
  }

  static async create(body: CreateGroup, token: string) {
    return api.post<Group>('/group', body, { token });
  }

  static async update(
    groupId: string,
    body: UpdateGroup,
    token: string
  ): Promise<Group> {
    return api.patch<Group>(`/group/${groupId}`, body, { token });
  }

  static async batchUpdate(body: BatchUpdateGroups, token: string) {
    return api.patch<void>(`/group/update/batch`, body, { token });
  }

  static async delete(groupId: string, token: string) {
    return api.delete<void>(`/group/${groupId}`, { token });
  }

  static async addMember(groupId: string, body: UserId, token: string) {
    return api.patch<void>(`/group/${groupId}/member`, body, { token });
  }

  static async removeMember(groupId: string, body: UserId, token: string) {
    return api.delete<void>(`/group/${groupId}/member`, { body, token });
  }

  static async addCycle(groupId: string, cycle: Cycle, token: string) {
    return api.post<void>(`/group/${groupId}/cycle`, cycle, { token });
  }

  static async removeCycle(groupId: string, cycleId: string, token: string) {
    return api.delete<void>(`/group/${groupId}/cycle/${cycleId}`, { token });
  }
}
