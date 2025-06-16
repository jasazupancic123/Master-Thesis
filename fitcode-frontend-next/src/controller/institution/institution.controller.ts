import { CommonService } from '@/common/service/common.service';
import { Institution } from './type/institution.type';

const api = CommonService.instance.api;

export class InstitutionController {
  static async findAll(token: string) {
    return api.get<Institution[]>('/institution', { token });
  }

  static async findById(token: string, id: string) {
    return api.get<Institution>(`/institution/${id}`);
  }

  static async create(
    token: string,
    body: {
      name: string;
      athleteIds: string[];
      imageUrl: string;
      ownerId: string;
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
