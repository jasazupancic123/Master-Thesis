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

  static getInstance() {
    if (!this.instance) this.instance = new GroupController();
    return this.instance;
  }

  async findAll() {
    return this.api.get<Group[]>('/');
  }

  async findById(groupId: string) {
    return this.api.get<Group>(`/${groupId}`);
  }

  async create(body: CreateGroup) {
    return this.api.post<Group>('/', body);
  }

  async update(groupId: string, body: UpdateGroup): Promise<Group> {
    return this.api.patch<Group>(`/${groupId}`, body);
  }

  async batchUpdate(body: BatchUpdateGroups) {
    return this.api.patch<void>(`/update/batch`, body);
  }

  async delete(groupId: string) {
    return this.api.delete<void>(`/${groupId}`);
  }

  async addMember(groupId: string, body: UserId) {
    return this.api.patch<void>(`/${groupId}/member`, body);
  }

  async removeMember(groupId: string, body: UserId) {
    return this.api.delete<void>(`/${groupId}/member`, { body });
  }

  async addCycle(groupId: string, cycle: Cycle) {
    return this.api.post<void>(`/${groupId}/cycle`, cycle);
  }

  async removeCycle(groupId: string, cycleId: string) {
    return this.api.delete<void>(`/${groupId}/cycle/${cycleId}`);
  }
}
