import { BaseController } from '../base.controller';
import type { Profile } from '../profile/type/user.type';
import type { Cycle } from './type/cycle.type';
import type {
  BatchUpdateGroups,
  CreateGroup,
  Group,
  UpdateGroup,
} from './type/group.type';
import type {
  CreateInstitution,
  InitInstitution,
  Institution,
  UpdateInstitution,
  UserId,
} from './type/institution.type';
import type { FetchOptions } from '@/lib/common/type/api.type';

export class InstitutionController extends BaseController {
  private static instance: InstitutionController;

  private constructor() {
    super('/institution');
  }

  static getInstance() {
    if (!this.instance) this.instance = new InstitutionController();
    return this.instance;
  }

  async findAll(options?: FetchOptions) {
    return this.api.get<Institution[]>('/', options);
  }

  async init(institutionId: string, options?: FetchOptions) {
    return await this.api.get<InitInstitution>(`/${institutionId}`, options);
  }

  async create(body: CreateInstitution) {
    return this.api.post<Institution>('/', body);
  }

  async update(institutionId: string, body: UpdateInstitution) {
    return this.api.patch<Institution>(`/${institutionId}`, body);
  }

  async findAllMembersByInstitution(institutionId: string) {
    return this.api.get<Profile[]>(`/${institutionId}/member`);
  }

  async addAthlete(institutionId: string, body: UserId) {
    return this.api.patch<void>(`/${institutionId}/member/athlete`, body);
  }

  async removeAthlete(institutionId: string, body: UserId) {
    return this.api.delete<void>(`/${institutionId}/member/athlete`, { body });
  }

  async addTrainer(institutionId: string, body: UserId) {
    return this.api.patch<void>(`/${institutionId}/member/trainer`, body);
  }

  async removeTrainer(institutionId: string, body: UserId) {
    return this.api.delete<void>(`/${institutionId}/member/trainer`, { body });
  }

  async findAllGroupsByInstitution(institutionId: string) {
    return this.api.get<Group[]>(`/institution/${institutionId}/group`);
  }

  async createGroup(body: CreateGroup) {
    return this.api.post<Group>(
      `/institution/${body.institutionId}/group`,
      body
    );
  }

  async updateGroup(
    institutionId: string,
    groupId: string,
    body: UpdateGroup
  ): Promise<Group> {
    return this.api.patch<Group>(
      `/institution/${institutionId}/group/${groupId}`,
      body
    );
  }

  async batchUpdateGroups(institutionId: string, body: BatchUpdateGroups) {
    return this.api.patch<void>(
      `/institution/${institutionId}/group/update/batch`,
      body
    );
  }

  async deleteGroup(institutionId: string, groupId: string) {
    return this.api.delete<void>(
      `/institution/${institutionId}/group/${groupId}`
    );
  }

  async addGroupMember(institutionId: string, groupId: string, body: UserId) {
    return this.api.patch<void>(
      `/institution/${institutionId}/group/${groupId}/member`,
      body
    );
  }

  async removeGroupMember(
    institutionId: string,
    groupId: string,
    body: UserId
  ) {
    return this.api.delete<void>(
      `/institution/${institutionId}/group/${groupId}/member`,
      { body }
    );
  }

  async addCycle(institutionId: string, groupId: string, cycle: Cycle) {
    return this.api.post<void>(
      `/institution/${institutionId}/group/${groupId}/cycle`,
      cycle
    );
  }

  async removeCycle(institutionId: string, groupId: string, cycleId: string) {
    return this.api.delete<void>(
      `/institution/${institutionId}/group/${groupId}/cycle/${cycleId}`
    );
  }

  async findAllProtocolsByInstitution(institutionId: string) {
    return this.api.get(`/${institutionId}/protocol`);
  }
}
