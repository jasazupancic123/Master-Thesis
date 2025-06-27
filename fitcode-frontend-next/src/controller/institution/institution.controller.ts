import { CommonService } from '@/common/service/common.service';
import { Institution } from './type/institution.type';
import { UserEntity } from '../user/type/user.type';

const api = CommonService.instance.api;

export class InstitutionController {
  static async findAll(token: string) {
    return api.get<Institution[]>('/institution', { token });
  }

  static async findById(token: string, id: string) {
    return api.get<Institution>(`/institution/${id}`, { token });
  }

  static async findAthletes(token: string, id: string) {
    return api.get<UserEntity[]>(`/institution/${id}/athletes`, { token });
  }

  static async create(
    token: string,
    body: {
      ownerId: string;
      name: string;
      imageUrl: string;
    }
  ) {
    return api.post<Institution>('/institution', body, { token });
  }

  static async addAthletes(
    token: string,
    institutionId: string,
    body: { athleteIds: string[] }
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/athletes`,
      body,
      { token }
    );
  }

  static async removeAthletes(
    token: string,
    institutionId: string,
    body: { athleteIds: string[] }
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/athletes/delete`,
      body,
      { token }
    );
  }

  static async addTrainers(
    token: string,
    institutionId: string,
    body: { trainerIds: string[] }
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/trainers`,
      body,
      { token }
    );
  }

  static async removeTrainers(
    token: string,
    institutionId: string,
    body: { trainerIds: string[] }
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/trainers/delete`,
      body,
      { token }
    );
  }
}
