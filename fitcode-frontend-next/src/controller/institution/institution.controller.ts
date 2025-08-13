import type { UserEntity } from '../user/type/user.type';
import type {
  CreateInstitution,
  Institution,
  UserId,
} from './type/institution.type';
import { CommonService } from '@/common/service/common.service';

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

  static async addAthlete(institutionId: string, body: UserId) {
    return api.patch<void>(`/institution/${institutionId}/athlete`, body);
  }

  static async removeAthlete(institutionId: string, body: UserId) {
    return api.delete<void>(`/institution/${institutionId}/athlete`, { body });
  }

  static async addTrainer(institutionId: string, body: UserId) {
    return api.patch<void>(`/institution/${institutionId}/trainer`, body);
  }

  static async removeTrainer(institutionId: string, body: UserId) {
    return api.delete<void>(`/institution/${institutionId}/trainer`, { body });
  }
}
