import { CommonService } from '@/common/service/common.service';
import {
  AddAthletesToInstitution,
  AddTrainersToInstitution,
  CreateInstitution,
  Institution,
} from './type/institution.type';
import { UserEntity } from '../user/type/user.type';

const api = CommonService.instance.api;

export class InstitutionController {
  static async findAll() {
    return api.get<Institution[]>('/institution');
  }

  static async findById(id: string, token?: string) {
    return api.get<Institution>(`/institution/${id}`, { token });
  }

  static async findAthletes(id: string) {
    return api.get<UserEntity[]>(`/institution/${id}/find/athletes`);
  }

  static async findTrainers(id: string) {
    return api.get<UserEntity[]>(`/institution/${id}/find/trainers`);
  }

  static async create(body: CreateInstitution) {
    return api.post<Institution>('/institution', body);
  }

  static async addAthletes(
    institutionId: string,
    body: AddAthletesToInstitution
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/athletes`,
      body
    );
  }

  static async removeAthletes(
    institutionId: string,
    body: AddAthletesToInstitution
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/athletes/delete`,
      body
    );
  }

  static async addTrainers(
    institutionId: string,
    body: AddTrainersToInstitution
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/trainers`,
      body
    );
  }

  static async removeTrainers(
    institutionId: string,
    body: AddTrainersToInstitution
  ) {
    return api.post<Institution>(
      `/institution/${institutionId}/trainers/delete`,
      body
    );
  }
}
