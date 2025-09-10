import { BaseController } from '../base.controller';
import type { UserId } from '../institution/type/institution.type';
import type { Cycle } from './type/cycle.type';
import type {
  BatchUpdateGroups,
  CreateGroup,
  Group,
  UpdateGroup,
} from './type/group.type';

export class GroupController extends BaseController {
  private static instance: GroupController;

  private constructor() {
    super('/group');
  }

  static getInstance(token: string) {
    if (!this.instance) this.instance = new GroupController();
    this.instance.setToken(token);
    return this.instance;
  }

  async findAll() {
    return this.api.get<Group[]>('/', { token: this.getToken() });
  }

  async findById(groupId: string) {
    return this.api.get<Group>(`/${groupId}`, { token: this.getToken() });
  }

  async findAllByInstitution(institutionId: string) {
    return this.api.get<Group[]>(`/institution/${institutionId}`, {
      token: this.getToken(),
    });
  }

  async create(body: CreateGroup) {
    return this.api.post<Group>('/', body, { token: this.getToken() });
  }

  async update(groupId: string, body: UpdateGroup): Promise<Group> {
    return this.api.patch<Group>(`/${groupId}`, body, {
      token: this.getToken(),
    });
  }

  async batchUpdate(body: BatchUpdateGroups) {
    return this.api.patch<void>(`/update/batch`, body, {
      token: this.getToken(),
    });
  }

  async delete(groupId: string) {
    return this.api.delete<void>(`/${groupId}`, {
      token: this.getToken(),
    });
  }

  async addMember(groupId: string, body: UserId) {
    return this.api.patch<void>(`/${groupId}/member`, body, {
      token: this.getToken(),
    });
  }

  async removeMember(groupId: string, body: UserId) {
    return this.api.delete<void>(`/${groupId}/member`, {
      body,
      token: this.getToken(),
    });
  }

  async addCycle(groupId: string, cycle: Cycle) {
    return this.api.post<void>(`/${groupId}/cycle`, cycle, {
      token: this.getToken(),
    });
  }

  async removeCycle(groupId: string, cycleId: string) {
    return this.api.delete<void>(`/${groupId}/cycle/${cycleId}`, {
      token: this.getToken(),
    });
  }
}
