import qs from 'qs';
import { Component } from '@/type/component.type';
import { fetcher } from '@/util/fetcher';
import { CreateExercise, Exercise } from '@/type/exercise.type';
import { Cycle } from '@/type/cycle.type';
import { Group } from '@/type/group.type';
import { SetGroup, SuperExerciseInfo, Training } from '@/type/training.type';
import { CustomClaims } from '@/type/custom-claims.type';
import { PaginateOptions } from '@/type/paginate.type';
import { UserWellness } from '@/type/user-wellness.type';

function getQuery(query?: Record<string, string>) {
  return query ? `?${qs.stringify(query)}` : '';
}

export class FitcodeApi {
  static URL = {
    profile: () => '/user/me/profile',
    users: () => '/user',
    userById: (id: string) => `/user/${id}`,
    userClaims: (id: string) => `/user/${id}/claims`,
    components: () => '/component',
    componentById: (id: string) => `/component/${id}`,
    cycles: (query?: Record<string, string>) => `/cycle${getQuery(query)}`,
    cycleById: (id: string) => `/cycle/${id}`,
    groups: () => '/group',
    athleteGroups: () => '/group/athlete/me',
    groupById: (id: string) => `/group/${id}`,
    exercisePageMeta: () => '/exercise/meta/page',
    exerciseById: (id: string) => `/exercise/${id}`,
    exerciseAttributes: () => '/exercise/attribute',
    wellness: () => '/user/wellness',
    wellnessToday: () => '/user/wellness/today',
    trainings: (query?: Record<string, string>) => `/training${getQuery(query)}`,
    athleteTrainings: (query?: Record<string, string>) => `/training/athlete/me${getQuery(query)}`,
  };

  static async updateUserClaims(uid: string, token: string, claims: CustomClaims) {
    return await fetcher<void>(this.URL.userClaims(uid), { method: 'PATCH', token, body: claims });
  }

  static async deleteUser(uid: string, token: string) {
    return await fetcher<void>(this.URL.userById(uid), { method: 'DELETE', token });
  }

  static async editComponent(id: string, token: string, body: Partial<Component>) {
    return await fetcher<Component>(this.URL.componentById(id), {
      method: 'PATCH',
      token,
      body,
    });
  }

  static async getGroup(groupId: string, token: string) {
    return await fetcher<Group>(this.URL.groupById(groupId), { token });
  }

  static async getAllGroups(token: string) {
    return await fetcher<Group[]>(this.URL.groups(), { token });
  }

  static async createGroup(body: Partial<Group>, token: string) {
    return await fetcher<Group>(`/group`, { method: 'POST', token, body });
  }

  static async getCycle(cycleId: string, token: string) {
    return await fetcher<Cycle>(this.URL.cycleById(cycleId), { token });
  }

  static async getAllCycles(token: string, query?: Record<string, string>) {
    return await fetcher<Cycle[]>(this.URL.cycles(query), { token });
  }

  static async createCycle(body: Partial<Cycle>, token: string) {
    return await fetcher<Cycle>(`/cycle`, { method: 'POST', token, body });
  }

  static async getExercisePageMeta(token: string, filter: {
    name?: string;
    componentIds?: string[]
  }, pageSize: number) {
    const query = qs.stringify({
      ...(filter?.name && { name: filter.name }),
      ...(filter?.componentIds && { componentIds: filter.componentIds.join(',') }),
      pageSize,
    });

    const url = `${this.URL.exercisePageMeta()}?${query}`;
    return await fetcher<{ total: number, pages: number }>(url, { token });
  }

  static async findAllExercises(
    token: string,
    filter?: { name?: string; componentIds?: string[] },
    paginate?: PaginateOptions<Exercise>,
  ) {
    const query = qs.stringify({
      ...(filter?.name && { name: filter.name }),
      ...(filter?.componentIds && { componentIds: filter.componentIds.join(',') }),
      ...paginate,
    });

    const url = query ? `/exercise?${query}` : '/exercise';
    return await fetcher<Exercise[]>(url, { token });
  }

  static async getExercise(id: string, token: string) {
    return await fetcher<Exercise>(this.URL.exerciseById(id), { token });
  }

  static async createExercise(body: CreateExercise, token: string) {
    return await fetcher<{ id: string, rootComponentIds: string[] }>(`/exercise`, { method: 'POST', token, body });
  }

  static async updateExercise(body: Partial<Exercise>, token: string) {
    return await fetcher<{ rootComponentIds: string[] }>(`/exercise/${body.id}`, { method: 'PATCH', token, body });
  }

  static async findAllTrainings(token: string, filter?: {
    cycleId?: string;
    subgroupId?: string;
    startTime?: string;
    endTime?: string
  }) {
    const query = {
      ...(filter?.cycleId && { cycleId: filter.cycleId }),
      ...(filter?.subgroupId && { subgroupId: filter.subgroupId }),
      ...(filter?.startTime && { startTime: filter.startTime }),
      ...(filter?.endTime && { endTime: filter.endTime }),
    };

    return await fetcher<Training[]>(this.URL.trainings(query), { token });
  }

  static async createTraining(
    body: {
      cycleId: string;
      componentIds: string[];
      startTime: string;
      endTime: string;
    },
    token: string,
  ) {
    return await fetcher<Training>(this.URL.trainings(), { method: 'POST', token, body });
  }

  static async findAllAthleteTrainings(token: string, filter?: {
    cycleId?: string;
    startTime?: string;
    endTime?: string
  }) {
    const query = {
      ...(filter?.cycleId && { cycleId: filter.cycleId }),
      ...(filter?.startTime && { startTime: filter.startTime }),
      ...(filter?.endTime && { endTime: filter.endTime }),
    };

    return await fetcher<Training[]>(this.URL.athleteTrainings(query), { token });
  }

  static async addSet(
    body: {
      trainingId: string;
      componentId: string;
      order: number;
    },
    token: string,
  ) {
    return await fetcher<SetGroup>(`/training/set`, { method: 'POST', token, body });
  }

  static async getSet(trainingId: string, subgroupId: string, token: string) {
    return await fetcher<SetGroup>(`/training/${trainingId}/set/${subgroupId}`, { token });
  }

  static async addSetExercises(
    body: { setSubgroupId: string; exerciseIds: string[]; } & Partial<SuperExerciseInfo>,
    token: string,
  ) {
    const { setSubgroupId, ...data } = body;
    return await fetcher<Training>(`/training/set/subgroup/${setSubgroupId}`, {
      method: 'POST',
      token,
      body,
    });
  }

  static async updateSetExercise(
    setExerciseId: string,
    body: Partial<SuperExerciseInfo> & { order?: number },
    token: string,
  ) {
    return await fetcher<Training>(`/training/set/subgroup/exercise/${setExerciseId}`, {
      method: 'PATCH',
      token,
      body,
    });
  }

  static async removeTraining(trainingId: string, token: string) {
    return await fetcher<void>(`/training/${trainingId}`, { method: 'DELETE', token });
  }

  static async createWellness(data: Partial<UserWellness>, token: string) {
    return await fetcher<UserWellness>(FitcodeApi.URL.wellness(), { method: 'POST', body: data, token });
  }

  static async getWellnessForToday(token: string) {
    return await fetcher<UserWellness>(FitcodeApi.URL.wellnessToday(), { token });
  }
}