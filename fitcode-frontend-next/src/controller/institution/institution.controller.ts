import { CommonService } from '@/common/service/common.service';
import { Institution } from './type/institution.type';
import { UserEntity } from '../user/type/user.type';

const api = CommonService.instance.api;

export class InstitutionController {
  static async findAll() {
    return api.get<Institution[]>('/institution');
  }

  static async findById(id: string) {
    return api.get<Institution>(`/institution/${id}`);
  }

  static async findAthletes(id: string) {
    return api.get<UserEntity[]>(`/institution/${id}/athletes`);
  }

  static async create(body: {
    ownerId: string;
    name: string;
    imageUrl: string;
  }) {
    return api.post<Institution>('/institution', body);
  }

  static async addAthletes(
    institutionId: string,
    body: { athleteIds: string[] }
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/athletes`,
      body
    );
  }

  static async removeAthletes(
    institutionId: string,
    body: { athleteIds: string[] }
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/athletes/delete`,
      body
    );
  }

  static async addTrainers(
    institutionId: string,
    body: { trainerIds: string[] }
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/trainers`,
      body
    );
  }

  static async removeTrainers(
    institutionId: string,
    body: { trainerIds: string[] }
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/trainers/delete`,
      body
    );
  }
}
