import { CommonService } from '@/common/service/common.service';
import { Group } from '@/group/entity/group.entity';
import { CreateGroup, UpdateGroup } from '@/group/type/group.type';
import { CreateCycle } from '@/group/type/cycle.type';
import { Cycle } from '@/group/entity/cycle.entity';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { CreateSubgroup } from '@/group/type/subgroup.type';
import { Training } from '@/training/type/training.type';

const commonService = CommonService.instance;

export class GroupController {
  static async findAll(token: string) {
    return await commonService.api.fetch<Group[]>('/group', { token });
  }

  static async findOneById(token: string, id: string) {
    return await commonService.api.fetch<Group>(`/group/${id}`, { token });
  }

  static async create(token: string, body: CreateGroup) {
    return await commonService.api.fetch<Group>('/group', { token, method: 'POST', body });
  }

  static async update(token: string, id: string, body: UpdateGroup) {
    return await commonService.api.fetch<Group>(`/group/${id}`, { token, method: 'PATCH', body });
  }

  static async findAllCycles(token: string, groupId: string) {
    return await commonService.api.fetch<Cycle[]>(`/group/${groupId}/cycle`, { token });
  }

  static async findOneCycleById(token: string, groupId: string, cycleId: string) {
    return await commonService.api.fetch<Cycle>(`/group/${groupId}/cycle/${cycleId}`, { token });
  }

  static async addCycle(token: string, groupId: string, body: CreateCycle) {
    return await commonService.api.fetch<Cycle>(`/group/${groupId}/cycle`, { token, method: 'POST', body });
  }

  static async updateCycle(token: string, groupId: string, cycleId: string, body: CreateCycle) {
    return await commonService.api.fetch<Cycle>(`/group/${groupId}/cycle/${cycleId}`, { token, method: 'PATCH', body });
  }

  static async findAllSubgroups(token: string, groupId: string) {
    return await commonService.api.fetch<Subgroup[]>(`/group/${groupId}/subgroup`, { token });
  }

  static async findOneSubgroupById(token: string, groupId: string, subgroup: string) {
    return await commonService.api.fetch<Subgroup>(`/group/${groupId}/subgroup/${subgroup}`, { token });
  }

  static async addSubgroup(token: string, groupId: string, body: Subgroup) {
    return await commonService.api.fetch<Subgroup>(`/group/${groupId}/subgroup`, { token, method: 'POST', body });
  }

  static async updateSubgroup(token: string, groupId: string, subgroup: string, body: CreateSubgroup) {
    return await commonService.api.fetch<Subgroup>(`/group/${groupId}/subgroup/${subgroup}`, { token, method: 'PATCH', body });
  }

  static async findAllTrainings(token: string, groupId: string, cycleId: string) {
    return await commonService.api.fetch<Training[]>(`/group/${groupId}/cycle/${cycleId}/training`, { token });
  }
}