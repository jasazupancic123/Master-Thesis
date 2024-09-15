import { CommonService } from '@/common/service/common.service';
import { Group } from '@/group/entity/group.entity';
import { CreateGroup, UpdateGroup } from '@/group/type/group.type';
import { CreateCycle } from '@/group/type/cycle.type';
import { Cycle } from '@/group/entity/cycle.entity';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { CreateSubgroup } from '@/group/type/subgroup.type';
import { Training } from '@/training/entity/training.entity';
import { CreateTraining, FilterTrainingQuery, UpdateTraining } from '@/training/type/training.type';
import { TrainingComponent } from '@/training/entity/training-component.entity';
import { CreateTrainingComponent, UpdateTrainingComponent } from '@/training/type/training-component.type';
import { TrainingExercise } from '@/training/entity/training-exercise.entity';
import { CreateTrainingExercise, UpdateTrainingExercise } from '@/training/type/training-exercise.type';
import dayjs from 'dayjs';
import { TrainingSuperset } from '@/training/entity/training-superset.entity';
import { CreateTrainingSuperset } from '@/training/type/training-superset.type';

const commonService = CommonService.instance;

export class GroupController {
  static URL = {
    groups: () => '/group',
    groupById: (groupId: string) => `/group/${groupId}`,
    groupAvailableMembers: (groupId: string) => `/group/${groupId}/available-members`,
    cycles: (groupId: string) => `/group/${groupId}/cycle`,
    cycleById: (groupId: string, cycleId: string) => `/group/${groupId}/cycle/${cycleId}`,
    subgroups: (groupId: string) => `/group/${groupId}/subgroup`,
    subgroupById: (groupId: string, subgroupId: string) => `/group/${groupId}/subgroup/${subgroupId}`,
    trainings: (groupId = 'active', cycleId = 'active', filter?: FilterTrainingQuery) => {
      const query = {
        ...(filter?.subgroupId && { subgroupId: filter.subgroupId }),
        ...(filter?.from && { from: dayjs(filter.from).toISOString() }),
        ...(filter?.to && { to: dayjs(filter.to).toISOString() }),
      };

      return `/group/${groupId}/cycle/${cycleId}/training${commonService.api.query(query)}`;
    },
    trainingById: (groupId: string, cycleId: string, trainingId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}`,
    trainingComponents: (groupId: string, cycleId: string, trainingId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component`,
    trainingComponentById: (groupId: string, cycleId: string, trainingId: string, componentId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component/${componentId}`,
    trainingSupersets: (groupId: string, cycleId: string, trainingId: string, componentId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component/${componentId}/superset`,
    trainingSupersetById: (groupId: string, cycleId: string, trainingId: string, componentId: string, supersetId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component/${componentId}/superset/${supersetId}`,
    trainingExercises: (groupId: string, cycleId: string, trainingId: string, componentId: string, supersetId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component/${componentId}/superset/${supersetId}/exercise`,
    trainingExerciseById: (groupId: string, cycleId: string, trainingId: string, componentId: string, supersetId: string, exerciseId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component/${componentId}/superset/${supersetId}/exercise/${exerciseId}`,
  };

  static async findGroups(token: string) {
    return await commonService.api.fetch<Group[]>(this.URL.groups(), { token });
  }

  static async findGroup(token: string, groupId: string) {
    return await commonService.api.fetch<Group>(this.URL.groupById(groupId), { token });
  }

  static async findGroupAvailableMembers(token: string, groupId: string) {
    return await commonService.api.fetch<string[]>(this.URL.groupAvailableMembers(groupId), { token });
  }

  static async createGroup(token: string, body: CreateGroup) {
    return await commonService.api.fetch<Group>(this.URL.groups(), { token, method: 'POST', body });
  }

  static async updateGroup(token: string, groupId: string, body: UpdateGroup) {
    return await commonService.api.fetch<Group>(this.URL.groupById(groupId), { token, method: 'PATCH', body });
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

  static async updateCycle(token: string, groupId: string, cycleId: string, body: CreateCycle) {
    return await commonService.api.fetch<Cycle>(this.URL.cycleById(groupId, cycleId), { token, method: 'PATCH', body });
  }

  static async addSubgroup(token: string, groupId: string, body: CreateSubgroup) {
    return await commonService.api.fetch<Subgroup>(this.URL.subgroups(groupId), { token, method: 'POST', body });
  }

  static async updateSubgroup(token: string, groupId: string, subgroupId: string, body: CreateSubgroup) {
    return await commonService.api.fetch<Subgroup>(this.URL.subgroupById(groupId, subgroupId), {
      token,
      method: 'PATCH',
      body,
    });
  }

  static async findTrainings(token: string, groupId: string, cycleId: string, filter?: FilterTrainingQuery) {
    return await commonService.api.fetch<Training[]>(this.URL.trainings(groupId, cycleId, filter), { token });
  }

  static async addTraining(token: string, groupId: string, cycleId: string, input: CreateTraining) {
    const body = {
      subgroupId: input.subgroupId || null,
      from: dayjs(input.from).toISOString(),
      to: dayjs(input.to).toISOString(),
      componentIds: input.componentIds,
    };

    return await commonService.api.fetch<Training>(this.URL.trainings(groupId, cycleId), {
      token,
      method: 'POST',
      body,
    });
  }

  static async updateTraining(token: string, groupId: string, cycleId: string, trainingId: string, body: UpdateTraining) {
    return await commonService.api.fetch<Training>(this.URL.trainingById(groupId, cycleId, trainingId), {
      token,
      method: 'PATCH',
      body,
    });
  }

  static async addTrainingComponents(token: string, groupId: string, cycleId: string, trainingId: string, input: CreateTrainingComponent[]) {
    return await commonService.api.fetch<TrainingComponent[]>(this.URL.trainingComponents(groupId, cycleId, trainingId), {
      token,
      method: 'POST',
      body: {
        components: input,
      },
    });
  }

  static async updateTrainingComponent(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string, body: UpdateTrainingComponent) {
    return await commonService.api.fetch<TrainingComponent>(this.URL.trainingComponentById(groupId, cycleId, trainingId, componentId), {
      token,
      method: 'PATCH',
      body,
    });
  }

  static async addSuperset(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string, body: CreateTrainingSuperset) {
    return await commonService.api.fetch<TrainingSuperset>(this.URL.trainingSupersets(groupId, cycleId, trainingId, componentId), {
      token,
      method: 'POST',
      body,
    });
  }

  static async addTrainingExercises(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string, supersetId: string, input: CreateTrainingExercise[]) {
    return await commonService.api.fetch<TrainingExercise[]>(this.URL.trainingExercises(groupId, cycleId, trainingId, componentId, supersetId), {
      token,
      method: 'POST',
      body: {
        exercises: input,
      },
    });
  }

  static async updateExercise(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string, supersetId: string, exerciseId: string, body: UpdateTrainingExercise) {
    return await commonService.api.fetch<TrainingExercise>(this.URL.trainingExerciseById(groupId, cycleId, trainingId, componentId, supersetId, exerciseId), {
      token,
      method: 'PATCH',
      body,
    });
  }
}