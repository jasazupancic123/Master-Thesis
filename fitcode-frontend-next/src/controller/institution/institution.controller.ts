import { CommonService } from '@/common/service/common.service';
import { Institution } from './type/institution.type';

const api = CommonService.instance.api;

export class InstitutionController {
  static async findAllByUser(token: string) {
    return api.get<Institution[]>('/institution/user', { token });
  }

  static async create(
    token: string,
    body: {
      name: string;
      trainerIds: string[];
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
      `/institution/${institutionId}/remove/athletes`,
      body,
      { token }
    );
  }
}
