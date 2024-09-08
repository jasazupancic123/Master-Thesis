import qs from 'qs';
import { Component } from '@/component/type/component.type';
import { CreateExercise, Exercise } from '@/exercise/type/exercise.type';
import { Cycle } from '@/group/type/cycle.type';
import { Group } from '@/group/type/group.type';
import { SetGroup, SuperExerciseInfo, Training } from '@/training/type/training.type';
import { CustomClaims } from '@/user/type/custom-claims.type';
import { PaginateOptions } from '@/common/type/paginate.type';
import { Wellness } from '@/user/entity/wellness.entity';
import { BASE_URL } from '@/common/constant/api.constant';
import { FetchOptions } from '@/common/type/api.type';

function getQuery(query?: Record<string, string | number | (string | number)[]>) {
  return query ? `?${qs.stringify(query)}` : '';
}

export class ApiUtil {
  static URL = {
    users: () => '/user',
    userById: (id: string) => `/user/${id}`,
    userClaims: (id: string) => `/user/${id}/claims`,
    components: () => '/components',
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

  async fetch<T>(url: string, options?: FetchOptions): Promise<T> {
    const { method = 'GET', token, body, query, formData } = options || {};

    const res = await fetch(`${BASE_URL}${url}${getQuery(query)}`, {
      method,
      headers: {
        ...(!formData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...(formData ? { body: formData } : {}),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'An error occurred');
    }

    return res.json();
  }

  async updateUserClaims(uid: string, token: string, claims: CustomClaims) {
    return await fetcher<void>(ApiUtil.URL.userClaims(uid), { method: 'PATCH', token, body: claims });
  }

  async deleteUser(uid: string, token: string) {
    return await fetcher<void>(ApiUtil.URL.userById(uid), { method: 'DELETE', token });
  }

  async editComponent(id: string, token: string, body: Partial<Component>) {
    return await fetcher<Component>(ApiUtil.URL.componentById(id), {
      method: 'PATCH',
      token,
      body,
    });
  }

  async getGroup(groupId: string, token: string) {
    return await fetcher<Group>(ApiUtil.URL.groupById(groupId), { token });
  }

  async getAllGroups(token: string) {
    return await fetcher<Group[]>(ApiUtil.URL.groups(), { token });
  }

  async createGroup(body: Partial<Group>, token: string) {
    return await fetcher<Group>(`/group`, { method: 'POST', token, body });
  }

  async getCycle(cycleId: string, token: string) {
    return await fetcher<Cycle>(ApiUtil.URL.cycleById(cycleId), { token });
  }

  async getAllCycles(token: string, query?: Record<string, string>) {
    return await fetcher<Cycle[]>(ApiUtil.URL.cycles(query), { token });
  }

  async createCycle(body: Partial<Cycle>, token: string) {
    return await fetcher<Cycle>(`/cycle`, { method: 'POST', token, body });
  }

  async getExercisePageMeta(token: string, filter: {
    name?: string;
    componentIds?: string[]
  }, pageSize: number) {
    const query = qs.stringify({
      ...(filter?.name && { name: filter.name }),
      ...(filter?.componentIds && { componentIds: filter.componentIds.join(',') }),
      pageSize,
    });

    const url = `${ApiUtil.URL.exercisePageMeta()}?${query}`;
    return await fetcher<{ total: number, pages: number }>(url, { token });
  }

  async findAllExercises(
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

  async getExercise(id: string, token: string) {
    return await fetcher<Exercise>(ApiUtil.URL.exerciseById(id), { token });
  }

  async createExercise(body: CreateExercise, token: string) {
    return await fetcher<{ id: string, rootComponentIds: string[] }>(`/exercise`, { method: 'POST', token, body });
  }

  async updateExercise(body: Partial<Exercise>, token: string) {
    return await fetcher<{ rootComponentIds: string[] }>(`/exercise/${body.id}`, { method: 'PATCH', token, body });
  }

  async findAllTrainings(token: string, filter?: {
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

    return await fetcher<Training[]>(ApiUtil.URL.trainings(query), { token });
  }

  async createTraining(
    body: {
      cycleId: string;
      componentIds: string[];
      startTime: string;
      endTime: string;
    },
    token: string,
  ) {
    return await fetcher<Training>(ApiUtil.URL.trainings(), { method: 'POST', token, body });
  }

  async findAllAthleteTrainings(token: string, filter?: {
    cycleId?: string;
    startTime?: string;
    endTime?: string
  }) {
    const query = {
      ...(filter?.cycleId && { cycleId: filter.cycleId }),
      ...(filter?.startTime && { startTime: filter.startTime }),
      ...(filter?.endTime && { endTime: filter.endTime }),
    };

    return await fetcher<Training[]>(ApiUtil.URL.athleteTrainings(query), { token });
  }

  async addSet(
    body: {
      trainingId: string;
      componentId: string;
      order: number;
    },
    token: string,
  ) {
    return await fetcher<SetGroup>(`/training/set`, { method: 'POST', token, body });
  }

  async getSet(trainingId: string, subgroupId: string, token: string) {
    return await fetcher<SetGroup>(`/training/${trainingId}/set/${subgroupId}`, { token });
  }

  async addSetExercises(
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

  async updateSetExercise(
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

  async removeTraining(trainingId: string, token: string) {
    return await fetcher<void>(`/training/${trainingId}`, { method: 'DELETE', token });
  }

  async createWellness(data: Partial<UserWellness>, token: string) {
    return await fetcher<UserWellness>(ApiUtil.URL.wellness(), { method: 'POST', body: data, token });
  }

  async getWellnessForToday(token: string) {
    return await fetcher<UserWellness>(ApiUtil.URL.wellnessToday(), { token });
  }
}