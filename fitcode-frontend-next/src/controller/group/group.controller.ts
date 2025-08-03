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

  static async findById(groupId: string) {
    return api.get<Group>(`/group/${groupId}`);
  }

  static async findAllByInstitution(institutionId: string) {
    return api.get<Group[]>(`/group/institution/${institutionId}`);
  }

  static async create(body: CreateGroup) {
    return api.post<Group>('/group', body);
  }

  static async update(groupId: string, body: UpdateGroup): Promise<Group> {
    return api.patch<Group>(`/group/${groupId}`, body);
  }

  static async batchUpdate(body: BatchUpdateGroups) {
    return api.patch<void>(`/group/update/batch`, body);
  }

  static async delete(groupId: string) {
    return api.delete<void>(`/group/${groupId}`);
  }
}
