import { CommonService } from '@/common/service/common.service';
import { Group } from '@/group/entity/group.entity';
import { CreateGroup, UpdateGroup } from '@/group/type/group.type';
import { CreateCycle, UpdateCycle } from '@/group/type/cycle.type';
import { Cycle } from '@/group/entity/cycle.entity';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { CreateSubgroup, UpdateSubgroup } from '@/group/type/subgroup.type';
import dayjs, { Dayjs } from 'dayjs';

const commonService = CommonService.instance;

export class GroupController {
  static URL = {
    groups: () => '/group',
    groupById: (groupId: string) => `/group/${groupId}`,
    groupAvailableMembers: (groupId: string, filter: {
      from: Dayjs
    }) => `/group/${groupId}/availableMembers?from=${filter.from.toISOString()}`,
    cycles: (groupId: string) => `/group/${groupId}/cycle`,
    cycleById: (groupId: string, cycleId: string) => `/group/${groupId}/cycle/${cycleId}`,
    subgroups: (groupId: string, filter?: { from: Dayjs, to: Dayjs }) =>
      `/group/${groupId}/subgroup` + (filter ? `?from=${filter.from.toISOString()}&to=${filter.to.toISOString()}` : ''),
    subgroupById: (groupId: string, subgroupId: string) => `/group/${groupId}/subgroup/${subgroupId}`,
  };

  static async findGroup(token: string, groupId: string) {
    return await commonService.api.fetch<Group>(this.URL.groupById(groupId), { token });
  }

  static async createGroup(token: string, body: CreateGroup) {
    return await commonService.api.fetch<Group>(this.URL.groups(), { token, method: 'POST', body });
  }

  static async updateGroup(token: string, groupId: string, body: UpdateGroup) {
    return await commonService.api.fetch<Group>(this.URL.groupById(groupId), { token, method: 'PATCH', body });
  }

  static async findAvailableMembers(token: string, groupId: string, filter: { from: Dayjs }) {
    return await commonService.api.fetch<string[]>(this.URL.groupAvailableMembers(groupId, filter), { token });
  }

  static async deleteCycle(token: string, groupId: string, cycleId: string) {
    return await commonService.api.fetch(this.URL.cycleById(groupId, cycleId), { token, method: 'DELETE' });
  }

  static async addCycle(token: string, groupId: string, input: CreateCycle) {
    const body: CreateCycle = {
      name: input.name,
      description: input.description,
      from: dayjs(input.from).toISOString() as unknown as Date,
      to: dayjs(input.to).toISOString() as unknown as Date,
    };

    return await commonService.api.fetch<Cycle>(this.URL.cycles(groupId), { token, method: 'POST', body });
  }

  static async updateCycle(token: string, groupId: string, cycleId: string, body: UpdateCycle) {
    return await commonService.api.fetch<Cycle>(this.URL.cycleById(groupId, cycleId), {
      token,
      method: 'PATCH',
      body: {
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.from && { from: dayjs(body.from).toISOString() as unknown as Date }),
        ...(body.to && { to: dayjs(body.to).toISOString() as unknown as Date }),
      },
    });
  }

  static async findSubgroups(token: string, groupId: string, filter: { from: Dayjs, to: Dayjs }) {
    return await commonService.api.fetch<Subgroup[]>(this.URL.subgroups(groupId, filter), { token });
  }

  static async addSubgroup(token: string, groupId: string, body: CreateSubgroup) {
    return await commonService.api.fetch<Subgroup>(this.URL.subgroups(groupId), { token, method: 'POST', body });
  }

  static async updateSubgroup(token: string, groupId: string, subgroupId: string, body: UpdateSubgroup) {
    return await commonService.api.fetch<Subgroup>(this.URL.subgroupById(groupId, subgroupId), {
      token,
      method: 'PATCH',
      body,
    });
  }

  static async deleteSubgroup(token: string, groupId: string, subgroupId: string) {
    return await commonService.api.fetch(this.URL.subgroupById(groupId, subgroupId), { token, method: 'DELETE' });
  }
}