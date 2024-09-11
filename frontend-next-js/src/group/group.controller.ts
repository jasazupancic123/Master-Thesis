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

const commonService = CommonService.instance;

export class GroupController {
  static URL = {
    groups: () => '/group',
    groupById: (groupId: string) => `/group/${groupId}`,
    cycles: (groupId: string) => `/group/${groupId}/cycle`,
    cycleById: (groupId: string, cycleId: string) => `/group/${groupId}/cycle/${cycleId}`,
    subgroups: (groupId: string) => `/group/${groupId}/subgroup`,
    subgroupById: (groupId: string, subgroupId: string) => `/group/${groupId}/subgroup/${subgroupId}`,
    trainings: (groupId: string, cycleId: string, filter?: FilterTrainingQuery) => {
      const query = {
        ...(filter?.subgroupId && { subgroupId: filter.subgroupId }),
        ...(filter?.from && { from: filter.from.toISOString() }),
        ...(filter?.to && { to: filter.to.toISOString() }),
      }

      return `/group/${groupId}/cycle/${cycleId}/training${commonService.api.query(query)}`;
    },
    trainingById: (groupId: string, cycleId: string, trainingId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}`,
    trainingComponents: (groupId: string, cycleId: string, trainingId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component`,
    trainingComponentById: (groupId: string, cycleId: string, trainingId: string, componentId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component/${componentId}`,
    trainingExercises: (groupId: string, cycleId: string, trainingId: string, componentId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component/${componentId}/exercise`,
    trainingExerciseById: (groupId: string, cycleId: string, trainingId: string, componentId: string, exerciseId: string) => `/group/${groupId}/cycle/${cycleId}/training/${trainingId}/component/${componentId}/exercise/${exerciseId}`,
  }

  static async findGroups(token: string) {
    return await commonService.api.fetch<Group[]>(this.URL.groups(), { token });
  }

  static async findGroup(token: string, id: string) {
    return await commonService.api.fetch<Group>(this.URL.groupById(id), { token });
  }

  static async createGroup(token: string, body: CreateGroup) {
    return await commonService.api.fetch<Group>(this.URL.groups(), { token, method: 'POST', body });
  }

  static async updateGroup(token: string, id: string, body: UpdateGroup) {
    return await commonService.api.fetch<Group>(this.URL.groupById(id), { token, method: 'PATCH', body });
  }

  static async findCycles(token: string, groupId: string) {
    return await commonService.api.fetch<Cycle[]>(this.URL.cycles(groupId), { token });
  }

  static async findCycleById(token: string, groupId: string, cycleId: string) {
    return await commonService.api.fetch<Cycle>(this.URL.cycleById(groupId, cycleId), { token });
  }

  static async addCycle(token: string, groupId: string, body: CreateCycle) {
    return await commonService.api.fetch<Cycle>(this.URL.cycles(groupId), { token, method: 'POST', body });
  }

  static async updateCycle(token: string, groupId: string, cycleId: string, body: CreateCycle) {
    return await commonService.api.fetch<Cycle>(this.URL.cycleById(groupId, cycleId), { token, method: 'PATCH', body });
  }

  static async findSubgroups(token: string, groupId: string) {
    return await commonService.api.fetch<Subgroup[]>(this.URL.subgroups(groupId), { token });
  }

  static async findSubgroupById(token: string, groupId: string, subgroupId: string) {
    return await commonService.api.fetch<Subgroup>(this.URL.subgroupById(groupId, subgroupId), { token });
  }

  static async addSubgroup(token: string, groupId: string, body: Partial<Subgroup>) {
    return await commonService.api.fetch<Subgroup>(this.URL.subgroups(groupId), { token, method: 'POST', body });
  }

  static async updateSubgroup(token: string, groupId: string, subgroupId: string, body: CreateSubgroup) {
    return await commonService.api.fetch<Subgroup>(this.URL.subgroupById(groupId, subgroupId), { token, method: 'PATCH', body });
  }

  static async findTrainings(token: string, groupId: string, cycleId: string, filter?: FilterTrainingQuery) {
    return await commonService.api.fetch<Training[]>(this.URL.trainings(groupId, cycleId, filter), { token });
  }

  static async findTraining(token: string, groupId: string, cycleId: string, trainingId: string) {
    return await commonService.api.fetch<Training>(this.URL.trainingById(groupId, cycleId, trainingId), { token });
  }

  static async addTraining(token: string, groupId: string, cycleId: string, body: CreateTraining) {
    return await commonService.api.fetch<Training>(this.URL.trainings(groupId, cycleId), { token, method: 'POST', body });
  }

  static async updateTraining(token: string, groupId: string, cycleId: string, trainingId: string, body: UpdateTraining) {
    return await commonService.api.fetch<Training>(this.URL.trainingById(groupId, cycleId, trainingId), { token, method: 'PATCH', body });
  }

  static async findTrainingComponents(token: string, groupId: string, cycleId: string, trainingId: string) {
    return await commonService.api.fetch<TrainingComponent[]>(this.URL.trainingComponents(groupId, cycleId, trainingId), { token });
  }

  static async findTrainingComponent(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string) {
    return await commonService.api.fetch<TrainingComponent>(this.URL.trainingComponentById(groupId, cycleId, trainingId, componentId), { token });
  }

  static async addTrainingComponent(token: string, groupId: string, cycleId: string, trainingId: string, body: CreateTrainingComponent) {
    return await commonService.api.fetch<TrainingComponent>(this.URL.trainingComponents(groupId, cycleId, trainingId), { token, method: 'POST', body });
  }

  static async updateTrainingComponent(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string, body: UpdateTrainingComponent) {
    return await commonService.api.fetch<TrainingComponent>(this.URL.trainingComponentById(groupId, cycleId, trainingId, componentId), { token, method: 'PATCH', body });
  }

  static async findTrainingComponentExercises(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string) {
    return await commonService.api.fetch<TrainingExercise[]>(this.URL.trainingExercises(groupId, cycleId, trainingId, componentId), { token });
  }

  static async findTrainingComponentExercise(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string, exerciseId: string) {
    return await commonService.api.fetch<TrainingExercise>(this.URL.trainingExerciseById(groupId, cycleId, trainingId, componentId, exerciseId), { token });
  }

  static async addTrainingComponentExercise(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string, body: CreateTrainingExercise) {
    return await commonService.api.fetch<TrainingExercise>(this.URL.trainingExercises(groupId, cycleId, trainingId, componentId), { token, method: 'POST', body });
  }

  static async updateTrainingComponentExercise(token: string, groupId: string, cycleId: string, trainingId: string, componentId: string, exerciseId: string, body: UpdateTrainingExercise) {
    return await commonService.api.fetch<TrainingExercise>(this.URL.trainingExerciseById(groupId, cycleId, trainingId, componentId, exerciseId), { token, method: 'PATCH', body });
  }
}